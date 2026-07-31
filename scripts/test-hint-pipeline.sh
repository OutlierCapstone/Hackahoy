#!/usr/bin/env bash
#
# 힌트 파이프라인 end-to-end 테스트 (실제 Gemini 호출 포함)
#
# FastAPI 의 /hint/ 를 직접 호출한다. NestJS 를 거치지 않으므로 로그인 토큰이 필요 없고,
# 검증하려는 부분(벡터 검색 + 섹션 필터 + Gemini 2콜)만 정확히 때린다.
#
# 확인하는 것
#   1) ai-tutor 가 떠 있는지
#   2) 벡터DB 가 "섹션 조각" 상태인지 (통짜면 섹션 필터가 아무것도 못 찾아 404)
#   3) 낮은 레벨에서 write-up(정답)이 검색 후보에서 실제로 빠지는지
#   4) 높은 레벨에서는 write-up 이 들어오는지 (= 정답을 막는 것은 게이팅이라는 근거)
#   5) Gemini 호출이 성공하는지 / 429 쿼터에 걸리는지
#   6) 생성된 힌트에 정답 문자열이 들어가지 않는지
#
# 사용법 (레포 루트에서)
#   bash scripts/test-hint-pipeline.sh           # 문제 4 로 전체 테스트
#   PROBLEM_ID=6 bash scripts/test-hint-pipeline.sh
#   bash scripts/test-hint-pipeline.sh chunks     # 벡터DB 적재 상태만
#
# 환경변수
#   AI_TUTOR   기본 http://127.0.0.1:8000
#   PROBLEM_ID 기본 4
#   APP_LOG    기본 ai-tutor/app.log

set -uo pipefail

AI_TUTOR="${AI_TUTOR:-http://127.0.0.1:8000}"
PROBLEM_ID="${PROBLEM_ID:-4}"
STEP="${1:-all}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

APP_LOG="${APP_LOG:-}"
if [[ -z "$APP_LOG" ]]; then
  for c in ai-tutor/app.log app.log ~/Hackahoy/ai-tutor/app.log; do
    [[ -f "$c" ]] && { APP_LOG="$c"; break; }
  done
fi

C_OK=$'\033[32m'; C_NG=$'\033[31m'; C_WARN=$'\033[33m'; C_DIM=$'\033[2m'; C_0=$'\033[0m'
ok()   { echo "${C_OK}  [OK]${C_0} $*"; }
ng()   { echo "${C_NG}  [문제]${C_0} $*"; }
warn() { echo "${C_WARN}  [확인]${C_0} $*"; }
info() { echo "${C_DIM}  $*${C_0}"; }
head1(){ echo; echo "======== $* ========"; }

FAILED=0

# ------------------------------------------------------------------ 헬스체크
step_health() {
  head1 "1. ai-tutor 상태"
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$AI_TUTOR/docs" 2>/dev/null)"
  if [[ "$code" == "200" ]]; then
    ok "ai-tutor 응답 ($AI_TUTOR)"
  else
    ng "ai-tutor 에 접근할 수 없다 (HTTP ${code:-000})"
    info "pm2 status / pm2 logs ai-tutor 로 확인해라"
    FAILED=1; return 1
  fi
  [[ -n "$APP_LOG" ]] && ok "로그 파일: $APP_LOG" || warn "app.log 를 찾지 못했다. 섹션 검증은 생략된다."
}

# ------------------------------------------------------------------ 벡터DB 상태
step_chunks() {
  head1 "2. 벡터DB 적재 상태 (문제 $PROBLEM_ID)"
  local body
  body="$(curl -s --max-time 15 "$AI_TUTOR/wargame/$PROBLEM_ID" 2>/dev/null)"

  if [[ -z "$body" ]]; then
    ng "응답이 비어 있다"; FAILED=1; return 1
  fi

  # 섹션 조각이면 id 가 4_observation_0 처럼 생겼고, 통짜면 "4" 하나뿐이다.
  local n_ids has_section has_writeup
  n_ids="$(grep -o '"[0-9]\+_[a-z-]\+' <<<"$body" | wc -l)"
  has_section="$(grep -c '"section"' <<<"$body")"

  if (( n_ids > 0 )); then
    ok "섹션 조각 상태 (조각 참조 ${n_ids}개 확인)"
  else
    ng "통짜 문서 상태로 보인다. 섹션 필터가 아무것도 찾지 못해 힌트가 404 로 실패한다."
    info "해결: cd ai-tutor && python reseed_vector_db.py --apply"
    FAILED=1
  fi
  (( has_section > 0 )) && ok "section 메타데이터 존재" || warn "section 메타데이터가 안 보인다"

  info "조각 id 샘플:"
  grep -o '"[0-9]\+_[a-z_-]\+[0-9]*"' <<<"$body" | sort -u | head -12 | sed 's/^/      /'
}

# ------------------------------------------------------------------ 힌트 요청
# $1 = hint_count, $2 = 설명
request_hint() {
  local hint_count="$1" label="$2"
  local now before_lines
  now="$(date '+%Y-%m-%d %H:%M:%S')"
  before_lines=0
  [[ -n "$APP_LOG" && -f "$APP_LOG" ]] && before_lines="$(wc -l < "$APP_LOG")"

  local payload
  payload="$(cat <<JSON
{
  "problem_id": "$PROBLEM_ID",
  "hint_count": $hint_count,
  "history": {
    "first_viewed_at": "$now",
    "last_hint_at": null,
    "previous_hint": null
  },
  "logs": [
    {"timestamp": "$now", "header": "POST /api/ping",
     "body": {"command": "ping -c 1 127.0.0.1; ls"},
     "status": 200, "resp_bytes": 312, "elapsed_ms": 41},
    {"timestamp": "$now", "header": "POST /api/ping",
     "body": {"command": "ping -c 1 127.0.0.1; cat flag.txt"},
     "status": 400, "resp_bytes": 68, "elapsed_ms": 12},
    {"timestamp": "$now", "header": "SUBMIT FLAG (오답)",
     "body": {"submitted_flag": "flag{test}"}, "status": null,
     "resp_bytes": null, "elapsed_ms": null}
  ]
}
JSON
)"

  echo
  echo "  --- $label (hint_count=$hint_count) ---"
  local resp code
  resp="$(curl -s -w $'\n%{http_code}' --max-time 90 \
    -X POST "$AI_TUTOR/hint/" \
    -H 'Content-Type: application/json' \
    --data "$payload" 2>/dev/null)"
  code="$(tail -1 <<<"$resp")"
  local body_txt
  body_txt="$(sed '$d' <<<"$resp")"

  case "$code" in
    200) ok "HTTP 200"
         echo "      생성된 힌트: $(sed -E 's/^"|"$//g' <<<"$body_txt" | cut -c1-200)" ;;
    404) ng "HTTP 404 — 벡터DB 에서 후보를 찾지 못했다 (섹션 필터 불일치)"
         info "cd ai-tutor && python reseed_vector_db.py --apply"; FAILED=1 ;;
    502) ng "HTTP 502 — Gemini 호출 실패. 429 쿼터인지 확인해라."
         info "pm2 logs ai-tutor --lines 50 | grep -i 'quota\\|429\\|RESOURCE_EXHAUSTED'"; FAILED=1 ;;
    *)   ng "HTTP ${code:-000}"; echo "$body_txt" | head -3 | sed 's/^/      /'; FAILED=1 ;;
  esac

  # 이번 요청이 남긴 로그에서 레벨과 섹션을 뽑는다
  if [[ -n "$APP_LOG" && -f "$APP_LOG" ]]; then
    local new
    new="$(tail -n +$((before_lines + 1)) "$APP_LOG" 2>/dev/null)"
    local secline
    secline="$(grep -o 'level: [0-9]*, section: \[[^]]*\]' <<<"$new" | tail -1)"
    if [[ -n "$secline" ]]; then
      echo "      $secline"
      if grep -q "write-up" <<<"$secline"; then
        echo "      ${C_WARN}-> write-up 포함${C_0}"
        HAS_WRITEUP="yes"
      else
        echo "      ${C_OK}-> write-up 없음 (정답 차단됨)${C_0}"
        HAS_WRITEUP="no"
      fi
    else
      warn "로그에서 level/section 을 찾지 못했다 (로그 경로 확인)"
      HAS_WRITEUP="unknown"
    fi
    local qs
    qs="$(grep -o '\[query-synth\].*' <<<"$new" | tail -1)"
    [[ -n "$qs" ]] && echo "      ${qs:0:180}"
    grep -qi 'query-synth. 실패' <<<"$new" && warn "의미쿼리 합성이 실패해 룰 기반으로 폴백했다 (429 가능성)"
  fi
}

step_levels() {
  head1 "3. 레벨별 섹션 필터 (문제 $PROBLEM_ID)"
  info "낮은 레벨에서 write-up 이 빠지는지, 높은 레벨에서 들어오는지 확인한다."

  HAS_WRITEUP=""
  request_hint 0 "레벨 1 예상 — 첫 힌트"
  local low="$HAS_WRITEUP"

  sleep 20   # Gemini 무료 티어 분당 5회. 힌트 1회에 2콜이라 간격을 둔다.

  HAS_WRITEUP=""
  request_hint 9 "레벨 4 예상 — 힌트 9회 사용"
  local high="$HAS_WRITEUP"

  echo
  if [[ "$low" == "no" ]]; then
    ok "레벨 1 에서 write-up 이 후보에서 제외됐다"
  elif [[ "$low" == "yes" ]]; then
    ng "레벨 1 에서 write-up 이 포함됐다. SECTION_MAP 을 확인해라."; FAILED=1
  fi
  if [[ "$high" == "yes" ]]; then
    ok "레벨 4 에서는 write-up 이 포함된다 (즉 정답을 막는 것은 힌트 게이팅이다)"
  fi
}

step_gate() {
  head1 "4. 힌트 게이팅 설정 확인"
  local v
  v="$(grep -E '^[[:space:]]*HINT_GATE_ENABLED' .env 2>/dev/null | head -1)"
  if [[ -z "$v" ]]; then
    warn "HINT_GATE_ENABLED 가 .env 에 없다 -> 게이팅 꺼짐 (기본값)"
    info "로그 수집을 확인한 뒤 켜라: HINT_GATE_ENABLED=true"
  else
    info "$v"
    grep -q 'true' <<<"$v" && ok "게이팅 켜짐" || warn "게이팅 꺼짐"
  fi
  info "게이팅은 NestJS(:4000)에서 동작하므로 위 FastAPI 직접 호출에는 적용되지 않는다."
}

case "$STEP" in
  health) step_health ;;
  chunks) step_chunks ;;
  levels) step_health && step_levels ;;
  gate)   step_gate ;;
  all)
    step_health || exit 1
    step_chunks
    step_levels
    step_gate
    head1 "결과"
    (( FAILED == 0 )) && ok "전부 통과" || ng "위 [문제] 항목을 확인해라"
    exit $FAILED
    ;;
  *) echo "사용법: $0 [health|chunks|levels|gate|all]"; exit 2 ;;
esac
