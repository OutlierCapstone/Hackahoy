# /app/routers/hints.py
#
# 변경 요약
#  1) collection.query 의 where 에 section 필터 적용 (레벨링 실제 작동 + write-up 물리적 제외)
#  2) raw 로그 이어붙이기 -> 룰 기반 압축 -> LLM 의미 문장 합성 으로 쿼리 생성
#  3) LLM 이 학습자 단계(stage)를 같이 반환 -> 힌트 레벨 계산에 반영
#  4) LLM 실패 시 룰 기반 압축문으로 fail-open (힌트가 절대 죽지 않음)

import json
import re
from datetime import datetime
from urllib.parse import unquote_plus

from fastapi import APIRouter, HTTPException

from app.clients import genai_client, logger, collection
from app.models import ProblemSolvingHistory, LogEntry, HintRequest

router = APIRouter(prefix="/hint", tags=["hint"])

N_RESULTS = 5
MAX_LOGS = 10          # 힌트 1회당 참조할 최근 로그 최대 개수
QUERY_MODEL = "gemini-2.5-flash-lite"
HINT_MODEL = "gemini-2.5-flash"

SECTION_MAP = {
    1: ["observation", "wrong"],
    2: ["observation", "thinking", "wrong"],
    3: ["thinking", "write-up", "wrong"],
    4: ["write-up", "point", "type_def", "wrong"],
}

# 학습자 단계 -> 최소 힌트 레벨 (횟수만으로 정하던 것을 상태로 보정)
# 주의: 여기의 하한을 3 이상으로 두면 안 된다.
# SECTION_MAP[3] 에는 write-up(정답 풀이)이 들어 있어서, LLM 이 stage 를
# "익스플로잇"/"근접" 으로 한 번 분류하기만 하면 hint_count=0 에서도
# 정답 문서가 검색 후보에 올라온다. 힌트 게이팅으로 시도 횟수를 요구해도
# 이 경로가 열려 있으면 의미가 없다.
# 정답 섹션은 누적 힌트 횟수(hint_count)로만 도달하게 둔다.
STAGE_MIN_LEVEL = {
    "탐색": 1,
    "취약점_식별": 2,
    "익스플로잇": 2,
    "근접": 2,
}

# ---------------------------------------------------------------------------
# 1. 룰 기반 로그 압축 (LLM 미사용, 결정론적)
# ---------------------------------------------------------------------------

# 페이로드에서 공격 기법을 추정해 "개념어"를 부착한다.
# 이 개념어가 붙는 것만으로도 임베딩 쿼리가 자연어 코퍼스 쪽으로 끌려간다.
ATTACK_PATTERNS = [
    (r"\bUNION\b\s+\bSELECT\b", "UNION 기반 SQL injection"),
    (r"\b(SLEEP|BENCHMARK)\s*\(|pg_sleep", "시간 기반 블라인드 SQL injection"),
    (r"\bOR\b\s*['\"]?\s*\d+\s*['\"]?\s*=\s*['\"]?\s*\d+", "불리언 항등식(OR 1=1) 인증 우회"),
    (r"(--|#|/\*)", "SQL 주석을 이용한 구문 절단"),
    (r"['\"]", "따옴표 삽입으로 구문 이스케이프 시도"),
    (r"[;|&`]|\$\(", "OS 커맨드 체이닝(command injection)"),
    (r"\.\./|\.\.%2f", "경로 탐색(path traversal)"),
    (r"<script|onerror\s*=|javascript:", "XSS 스크립트 삽입"),
    (r"\"alg\"\s*:\s*\"none\"", "JWT alg=none 서명 우회"),
    (r"eyJ[A-Za-z0-9_-]{6,}", "JWT 토큰 조작"),
    (r"\{\{.*?\}\}|\$\{.*?\}", "템플릿 인젝션"),
    (r"(ignore\s+(previous|above|all))|(이전|위의).{0,6}(무시|잊)|시스템\s*프롬프트",
     "프롬프트 인젝션(지시 무시 유도)"),
    (r"\bflag\b|flag\.txt", "flag 직접 접근 시도"),
    (r"/etc/passwd|/proc/self|\.env\b", "민감 파일 접근 시도"),
    (r"(\bid\b|\buser_?id\b|\bno\b)\s*[=:]\s*\d+", "식별자 조작(IDOR) 시도"),
    (r"\badmin\b|\broot\b", "권한 있는 계정 지목"),
]


def _decode(value) -> str:
    """
    URL 인코딩을 풀고, dict 는 key=value 형태로 평탄화한다.

    주의: json.dumps 를 쓰면 직렬화 따옴표(")가 붙어서
    "따옴표 삽입" 패턴이 모든 요청에 오탐한다. 그래서 값만 뽑아 이어붙인다.
    """
    if value is None:
        return ""

    if isinstance(value, dict):
        parts = []
        for k, v in value.items():
            if isinstance(v, (dict, list)):
                try:
                    v = json.dumps(v, ensure_ascii=False)
                except Exception:
                    v = str(v)
            parts.append(f"{k}={v}")
        value = ", ".join(parts)
    elif not isinstance(value, str):
        value = str(value)

    try:
        return unquote_plus(value)
    except Exception:
        return value


def detect_techniques(text: str) -> list[str]:
    found = []
    for pattern, concept in ATTACK_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            if concept not in found:
                found.append(concept)
    return found


def _fmt_bytes(n) -> str:
    if n is None:
        return ""
    try:
        n = int(n)
    except Exception:
        return ""
    return f"{n/1024:.1f}KB" if n >= 1024 else f"{n}B"


def distill_logs(logs: list[LogEntry]) -> tuple[str, list[str]]:
    """
    raw 로그 -> 사람이 읽을 수 있는 압축 이벤트 + 감지된 기법 목록.
    동일 (요청라인, 페이로드) 연타는 1건으로 접고 반복 횟수만 표기한다.
    """
    if not logs:
        return "요청 기록 없음", []

    collapsed = []
    for log in logs[-MAX_LOGS:]:
        header = _decode(getattr(log, "header", "")) or "UNKNOWN"
        payload = _decode(getattr(log, "body", None))
        status = getattr(log, "status", None)
        size = getattr(log, "resp_bytes", None)
        key = (header, payload, status)

        if collapsed and collapsed[-1]["key"] == key:
            collapsed[-1]["count"] += 1
            continue
        collapsed.append({"key": key, "count": 1,
                          "header": header, "payload": payload,
                          "status": status, "size": size})

    all_techniques: list[str] = []
    lines = []
    for idx, ev in enumerate(collapsed, start=1):
        techniques = detect_techniques(f"{ev['header']} {ev['payload']}")
        for t in techniques:
            if t not in all_techniques:
                all_techniques.append(t)

        parts = [ev["header"]]
        if ev["payload"]:
            snippet = ev["payload"][:200]
            parts.append(f"입력: {snippet}")
        if techniques:
            parts.append("감지: " + ", ".join(techniques))
        if ev["status"] is not None:
            resp = f"응답: {ev['status']}"
            size_str = _fmt_bytes(ev["size"])
            if size_str:
                resp += f" ({size_str})"
            parts.append(resp)
        if ev["count"] > 1:
            parts.append(f"x{ev['count']}회 반복")

        lines.append(f"{idx}. " + " | ".join(parts))

    return "\n".join(lines), all_techniques


# ---------------------------------------------------------------------------
# 2. 의미 쿼리 합성 (LLM 1콜, 실패 시 fail-open)
# ---------------------------------------------------------------------------

QUERY_PROMPT = """당신은 보안 워게임에서 학습자의 시도 로그를 분석하는 분석가입니다.
아래 시도 순서와 서버 응답을 보고 다음을 판단하세요.

(a) 학습자가 시도 중인 공격 기법
(b) 정확히 어디서 막혀 있는지
(c) 관련된 취약점 유형

규칙:
- 표준 보안 용어(예: SQL injection, IDOR, command injection)를 반드시 포함할 것
- 정답이나 해법은 절대 포함하지 말 것
- stage 는 다음 중 하나: 탐색 / 취약점_식별 / 익스플로잇 / 근접
- 아래 JSON 형식으로만 출력. 마크다운, 코드블록, 설명 금지.

{{"query": "<한 문장 서술>", "stage": "<단계>"}}

[문제 ID] {problem_id}
[감지된 기법] {techniques}
[시도 로그]
{distilled}
"""


def synthesize_query(problem_id: str, distilled: str, techniques: list[str]) -> tuple[str, str | None]:
    """
    압축 이벤트 -> 자연어 의미 문장 + 학습자 단계.
    LLM 실패 시 (압축문 + 개념어) 를 그대로 쿼리로 사용한다.
    """
    fallback = distilled
    if techniques:
        fallback = "학습자 시도 요약: " + ", ".join(techniques) + "\n" + distilled

    try:
        response = genai_client.models.generate_content(
            model=QUERY_MODEL,
            contents=QUERY_PROMPT.format(
                problem_id=problem_id,
                techniques=", ".join(techniques) if techniques else "없음",
                distilled=distilled,
            ),
        )
        raw = (response.text or "").strip()
        raw = re.sub(r"^```(?:json)?|```$", "", raw, flags=re.MULTILINE).strip()
        data = json.loads(raw)

        query = (data.get("query") or "").strip()
        stage = (data.get("stage") or "").strip() or None

        if not query:
            raise ValueError("empty query from model")

        # 개념어를 한 번 더 덧붙여 검색 신호를 강화
        if techniques:
            query = f"{query} (관련 기법: {', '.join(techniques)})"

        logger.info(f"[query-synth] stage={stage} query={query}")
        return query, stage

    except Exception as e:
        logger.warning(f"[query-synth] 실패, 룰 기반 폴백 사용: {e}")
        return fallback, None


# ---------------------------------------------------------------------------
# 3. 힌트 레벨 계산 (횟수 + 경과시간 + 학습자 단계)
# ---------------------------------------------------------------------------

def calculate_level(hint_count: int, history: ProblemSolvingHistory, stage: str | None = None) -> int:
    score = hint_count
    now = datetime.now()

    try:
        if history.last_hint_at:
            last_hint_time = datetime.strptime(history.last_hint_at, "%Y-%m-%d %H:%M:%S")
            if (now - last_hint_time).total_seconds() / 60 > 10:
                score += 1
                logger.info("Score increased for time since last hint.")
        elif history.first_viewed_at:
            first_view_time = datetime.strptime(history.first_viewed_at, "%Y-%m-%d %H:%M:%S")
            if (now - first_view_time).total_seconds() / 60 > 30:
                score += 1
                logger.info("Score increased for time since first viewed.")
    except Exception:
        logger.warning("Time parsing failed for history timestamps.")

    if score <= 2:
        level = 1
    elif score <= 5:
        level = 2
    elif score <= 8:
        level = 3
    else:
        level = 4

    # 학습자 단계로 하한 보정: 이미 익스플로잇 단계인데 observation 만 주는 상황 방지
    if stage:
        floor = STAGE_MIN_LEVEL.get(stage)
        if floor and floor > level:
            logger.info(f"Level raised by stage: {level} -> {floor} (stage={stage})")
            level = floor

    logger.debug(f"hint_count={hint_count}, score={score}, stage={stage}, level={level}")
    return level


# ---------------------------------------------------------------------------
# 4. 엔드포인트
# ---------------------------------------------------------------------------

@router.post("/")
def generate_hint(request: HintRequest) -> str:
    """Generate a contextual hint based on user logs and problem history"""

    # 4-1. 로그 -> 압축 이벤트 -> 의미 쿼리
    distilled, techniques = distill_logs(request.logs)
    logger.debug(f"[distilled]\n{distilled}")

    query_text, stage = synthesize_query(request.problem_id, distilled, techniques)

    # 4-2. 단계까지 반영한 레벨 -> 섹션 결정
    level = calculate_level(request.hint_count, request.history, stage)
    section = SECTION_MAP.get(level, SECTION_MAP[4])
    logger.debug(f"level: {level}, section: {section}")

    # 4-3. 섹션 필터를 건 검색 (write-up 은 레벨 3 미만에서 물리적으로 후보에 없음)
    try:
        search_results = collection.query(
            query_texts=[query_text],
            n_results=N_RESULTS,
            where={
                "$and": [
                    {"problem_id": request.problem_id},
                    {"section": {"$in": section}},
                ]
            },
        )

        if not search_results["documents"] or not search_results["documents"][0]:
            logger.error(
                "No relevant data found. "
                "벡터DB가 섹션 단위로 적재되지 않았을 수 있음 (reseed_vector_db.py 실행 필요)"
            )
            raise HTTPException(status_code=404, detail="Data not found")

        title = search_results["metadatas"][0][0]["title"]
        context = "\n".join(search_results["documents"][0])
        logger.debug(f"context: {context}")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error while querying ChromaDB: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

    # 4-4. 힌트 생성
    prompt = f"""
당신은 보안 워게임 튜터입니다.
다음 참고 자료를 바탕으로 사용자의 행동에 대해 정답을 직접 말하지 말고
보안 사고를 유도할 수 있는 질문을 던지세요.

출력은 마크다운 구문을 모두 제거하고 일반 텍스트 Plain text로만
최대 500자 이내로 간결하게 작성하세요.
줄바꿈 문자는 사용하지 마세요.

문제 제목: {title}
참고 자료: {context}
사용자 상황: {query_text}
사용자 시도 기록:
{distilled}
"""

    if request.history.previous_hint:
        prompt += f"\n직전에 제공된 힌트: {request.history.previous_hint}, 이것보다 조금만 더 알려주세요."

    try:
        response = genai_client.models.generate_content(
            model=HINT_MODEL,
            contents=prompt + "\n힌트: ",
        )

        hint_text = response.text.strip() if response.text else None
        logger.info(f"Generated hint: {hint_text}")

        if not hint_text:
            logger.error("Generated hint is empty.")
            raise HTTPException(status_code=502, detail="Empty response from Gemini")

        return hint_text

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Gemini API call failed: {e}")
        raise HTTPException(status_code=502, detail="AI service error")
