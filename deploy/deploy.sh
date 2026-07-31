#!/usr/bin/env bash
#
# deploy/deploy.sh
#
# 변경 요약
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
2>/dev/null | tail -n 1)
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

echo "==> [6/6] done: $(git rev-parse --short HEAD)"
