#!/usr/bin/env bash
#
# deploy/deploy.sh
#
# 변경 요약
#   [1.5] Gemini API 키 동기화
#         - GitHub Actions secret GEMINI_API_KEY 를 ai-tutor/.env 에 원자적으로 반영한다.
#         - 키 값은 어떤 로그에도 출력하지 않는다.
#         - secret 이 비어 있으면 기존 EC2 값을 유지한다.
#
#   [2.6] prisma migrate deploy 추가
#         - 스키마 변경이 있을 때마다 수동으로 EC2 들어가는 일을 없앤다.
#         - migrate deploy 는 적용된 마이그레이션이 없으면 아무것도 하지 않으므로 매 배포 실행이 안전하다.
#
#   [3.5] 벡터DB 섹션 적재 보장 (조건부 1회성)
#         - 컬렉션이 아직 "문제=1덩어리" 상태면 섹션 조각으로 재적재한다.
#         - 이미 조각 상태(_type_def 존재)면 건너뛴다.
#         - 매 배포마다 지우고 다시 넣지 않는다. 임베딩 API 비용과 다운타임을 피하기 위함.
#         - 강제로 다시 넣고 싶으면: FORCE_RESEED=1 로 workflow_dispatch 실행

set -euo pipefail
REPO_DIR="/home/ubuntu/Hackahoy"
BRANCH="main"
cd "$REPO_DIR"

echo "==> [1/6] pull ($BRANCH)"
git fetch --prune origin
git reset --hard "origin/${BRANCH}"

echo "==> [1.5] Gemini API key sync"
if [ -n "${GEMINI_API_KEY:-}" ]; then
  # 환경변수 값을 인자로 넘기거나 출력하지 않는다. Python 이 프로세스 환경에서 직접 읽는다.
  python3 - <<'PY'
import os
import tempfile
from pathlib import Path

key = os.environ.get("GEMINI_API_KEY", "").strip()
if not key:
    raise SystemExit("GEMINI_API_KEY is empty")
if "\n" in key or "\r" in key:
    raise SystemExit("GEMINI_API_KEY contains a newline")

path = Path("/home/ubuntu/Hackahoy/ai-tutor/.env")
existing = path.read_text(encoding="utf-8").splitlines() if path.exists() else []
updated = []
replaced = False

for line in existing:
    if line.lstrip().startswith("GEMINI_API_KEY="):
        if not replaced:
            updated.append(f"GEMINI_API_KEY={key}")
            replaced = True
        continue
    updated.append(line)

if not replaced:
    updated.append(f"GEMINI_API_KEY={key}")

path.parent.mkdir(parents=True, exist_ok=True)
fd, tmp_name = tempfile.mkstemp(prefix=".env.", dir=path.parent, text=True)
try:
    with os.fdopen(fd, "w", encoding="utf-8") as tmp:
        tmp.write("\n".join(updated).rstrip("\n") + "\n")
    os.chmod(tmp_name, 0o600)
    os.replace(tmp_name, path)
except Exception:
    try:
        os.unlink(tmp_name)
    except FileNotFoundError:
        pass
    raise

print("    -> GEMINI_API_KEY synchronized (value hidden)")
PY
else
  echo "    -> GEMINI_API_KEY secret is empty; keeping the existing EC2 value"
fi

echo "==> [2/6] backend build"
npm ci
npm run build

echo "==> [2.5] 프론트 빌드 (Next.js)"
( cd Hackahoy && npm ci && npm run build )
( cd Hackahoy && cp -r .next/static .next/standalone/.next/static 2>/dev/null; cp -r public .next/standalone/public 2>/dev/null )

echo "==> [2.6] prisma migrate"
npx prisma migrate deploy
npx prisma generate

echo "==> [3/6] ai-tutor deps"
if [ -f ai-tutor/requirements.txt ]; then
  python3 -m venv ai-tutor/venv
  ai-tutor/venv/bin/pip install --upgrade pip --quiet
  ai-tutor/venv/bin/pip install -r ai-tutor/requirements.txt --quiet
fi

echo "==> [3.5] 벡터DB 섹션 적재 확인"
if [ -f ai-tutor/reseed_vector_db.py ]; then
  (
    cd ai-tutor
    # 이미 섹션 조각으로 적재되어 있는지 확인 (_type_def 조각 존재 여부)
    NEEDS_RESEED=$(venv/bin/python - <<'PY'
try:
    from app.clients import collection
    ids = collection.get().get("ids", [])
    chunked = any(str(i).endswith("_type_def") for i in ids)
    print("0" if chunked else "1")
except Exception as e:
    # 판단 불가 시 재적재하지 않는다 (배포가 데이터를 건드리지 않게)
    print("0")
PY
)
    if [ "${FORCE_RESEED:-0}" = "1" ] || [ "$NEEDS_RESEED" = "1" ]; then
      echo "    -> 섹션 재적재 실행"
      cp -r "${CHROMA_PATH:-./chroma}" "${CHROMA_PATH:-./chroma}.bak.$(date +%s)" 2>/dev/null || true
      venv/bin/python reseed_vector_db.py --apply
    else
      echo "    -> 이미 섹션 조각 상태. 건너뜀"
    fi
  )
fi

echo "==> [4/6] pm2 reload"
pm2 startOrReload deploy/ecosystem.config.js --update-env
pm2 save

echo "==> [5/6] openresty"
docker compose up -d --build openresty

echo "==> [5.5] optional hint pipeline verification"
if [ "${VERIFY_HINT_PIPELINE:-0}" = "1" ]; then
  # FastAPI 를 직접 호출해 벡터 검색, 섹션 필터, Gemini 쿼리 합성/힌트 생성을 한 번에 검증한다.
  # NestJS 게이팅은 이 테스트의 대상이 아니며, 실제 Gemini 호출 2회를 사용한다.
  sleep 3
  NOW=$(date '+%Y-%m-%d %H:%M:%S')
  REQUEST_FILE=$(mktemp)
  RESPONSE_FILE=$(mktemp)
  trap 'rm -f "$REQUEST_FILE" "$RESPONSE_FILE"' EXIT

  cat > "$REQUEST_FILE" <<JSON
{
  "problem_id": "4",
  "hint_count": 0,
  "history": {
    "first_viewed_at": "$NOW",
    "last_hint_at": null,
    "previous_hint": null
  },
  "logs": [
    {
      "timestamp": "$NOW",
      "header": "POST /api/ping",
      "body": {"command": "ping -c 1 127.0.0.1; ls"},
      "status": 200,
      "resp_bytes": 312,
      "elapsed_ms": 41
    },
    {
      "timestamp": "$NOW",
      "header": "POST /api/ping",
      "body": {"command": "ping -c 1 127.0.0.1; cat flag.txt"},
      "status": 400,
      "resp_bytes": 68,
      "elapsed_ms": 12
    }
  ]
}
JSON

  HTTP_STATUS=$(curl -sS --max-time 120 \
    -o "$RESPONSE_FILE" -w '%{http_code}' \
    -X POST http://127.0.0.1:8000/hint/ \
    -H 'Content-Type: application/json' \
    --data-binary "@$REQUEST_FILE")

  echo "    -> hint endpoint HTTP ${HTTP_STATUS}"
  echo "    -> response: $(head -c 500 "$RESPONSE_FILE")"
  echo "    -> recent pipeline logs:"
  grep -E '\[query-synth\]|level:|section:|Generated hint|429|RESOURCE_EXHAUSTED|API_KEY' \
    ai-tutor/app.log 2>/dev/null | tail -10 || true

  if [ "$HTTP_STATUS" != "200" ]; then
    echo "    -> hint pipeline verification failed" >&2
    exit 1
  fi
  echo "    -> hint pipeline verification passed"
  rm -f "$REQUEST_FILE" "$RESPONSE_FILE"
  trap - EXIT
else
  echo "    -> skipped (workflow_dispatch verify_hint_pipeline=false)"
fi

echo "==> [6/6] done: $(git rev-parse --short HEAD)"
