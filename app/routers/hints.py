# /app/routers/hints.py

from fastapi import APIRouter, HTTPException
from datetime import datetime
from app.clients import genai_client, logger, collection
from app.models import ProblemSolvingHistory, LogEntry, HintRequest

router = APIRouter(prefix="/hint", tags=["hint"])

N_RESULTS = 5

# Calculate hint level
def calculate_level(hint_count: int, history: ProblemSolvingHistory) -> int:
    score = hint_count

    first_viewed_at = history.first_viewed_at
    last_hint_at = history.last_hint_at

    now = datetime.now()

    try:
        if last_hint_at:
            last_hint_time = datetime.strptime(last_hint_at, "%Y-%m-%d %H:%M:%S")
            diff_minutes = (now - last_hint_time).total_seconds() / 60

            if diff_minutes > 10: # Add score if it's been more than 10 minutes since the last hint
                score += 1
                logger.info("Score increased for time since last hint.")
                
        elif first_viewed_at:
            first_view_time = datetime.strptime(first_viewed_at, "%Y-%m-%d %H:%M:%S")
            diff_minutes = (now - first_view_time).total_seconds() / 60

            if diff_minutes > 30: # Add score if it's been more than 30 minutes since the problem was first viewed without any hints
                score += 1
                logger.info("Score increased for time since first viewed.")
                
    except Exception:
        logger.warning("Time parsing failed for history timestamps.")
        pass  # Exception handling for time parsing, continue with hint_count only
    
    # Map accumulated score to hint level (higher score → more explicit hint)
    if score <= 2:
        level = 1
    elif score <= 5:
        level = 2
    elif score <= 8:
        level = 3
    else:
        level = 4
        
    logger.debug(f"Hint count: {hint_count}, Score: {score}, Calculated Level: {level}")
    return level

def user_logs_to_str(logs: list[LogEntry]) -> list[str]:
    return [f"timestamp:\"{log.timestamp}\" - header:{log.header} - body:{log.body}" if log.body else f"timestamp:\"{log.timestamp}\" - header:{log.header}" for log in logs]

@router.post("/")
def generate_hint(request: HintRequest) -> str:
    '''Generate a contextual hint based on user logs and problem history'''
    level = calculate_level(request.hint_count, request.history)
    SECTION_MAP = {
    1: ["observation", "wrong"],
    2: ["observation", "thinking", "wrong"],
    3: ["thinking", "write-up", "wrong"],
    4: ["write-up", "point", "type_def", "wrong"]
    }

    section = SECTION_MAP.get(level, SECTION_MAP[4])
    logger.debug(f"section: {section}")
    
    query_text = "".join(user_logs_to_str(request.logs))
    logger.debug(f"Query texts: {query_text}")
        
    try:
        search_results = collection.query(
            query_texts=query_text,
            n_results=N_RESULTS,
            where={"$and":[
                    {"section": {"$in": section}},
                    {"problem_id": request.problem_id}
                ]
            }
        )

        if not search_results["documents"] or not search_results["documents"][0]:
            logger.error("No relevant data found")
            raise HTTPException(status_code=404, detail="Data not found")

        title = search_results["metadatas"][0][0]["title"]
        context = "\n".join(search_results["documents"][0])
        logger.debug(f"context: {context}")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error while querying ChromaDB: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

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
"""

    if request.history.previous_hint:
            prompt += f"\n직전에 제공된 힌트: {request.history.previous_hint}, 이것보다 조금만 더 알려주세요."

    try:
        response = genai_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt+"\n힌트: "
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