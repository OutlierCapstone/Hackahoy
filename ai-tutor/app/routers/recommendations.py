# /app/routers/recommendations.py
#
# 변경 요약: 벡터DB가 섹션 조각으로 적재되면 problem_id 를 id 로 쓰던 기존 코드가 전부 깨진다.
#   - collection.get(ids=["4"])            -> ids=["4_type_def"]
#   - collection.query(...)                -> where={"section": "type_def"} 추가
#   - collection.get()  (전체)             -> where={"section": "type_def"} 추가
#   type_def 는 문제당 정확히 1개이므로 "문제 1개 = 조각 1개"가 보장되어
#   추천 후보 계산이 조각 수에 오염되지 않는다.

from fastapi import APIRouter, HTTPException
from app.clients import logger, collection
from app.models import SolvedProblemInformation, RecommendRequest
import random

router = APIRouter(prefix="/recommendation", tags=["recommendation"])

E_THRESHOLD_HIGH = 0.001
E_THRESHOLD_MID = 0.0003
N_RESULTS = 5
SIM_WEIGHT = 0.65
DIFF_WEIGHT = 0.35
CAT_BONUS = 0.01

# 추천은 항상 type_def 조각(문제당 1개)만 대상으로 한다.
TYPE_DEF_FILTER = {"section": "type_def"}


def difficulty_to_int(diff: str) -> int:
    mapping = {"하": 1, "중": 2, "상": 3}
    return mapping.get(diff, 1)


def calculate_efficiency(solved_problem: SolvedProblemInformation, difficulty: int) -> float:
    if solved_problem.time_spent <= 0:
        return 0
    return difficulty / (solved_problem.time_spent * (solved_problem.hint_count + 1))


def build_candidates(results, solved_ids, target_difficulty, last_category):
    candidates = []

    for doc, meta, dist in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0],
    ):
        pid = meta["problem_id"]

        if pid in solved_ids:
            continue

        similarity_score = max(0, 1 - dist)

        difficulty = difficulty_to_int(meta["difficulty"])
        diff_penalty = abs(difficulty - target_difficulty)
        difficulty_score = 1 / (1 + diff_penalty)

        score = similarity_score * SIM_WEIGHT + difficulty_score * DIFF_WEIGHT

        if meta["category"] == last_category:
            score += CAT_BONUS

        logger.debug(
            f"pid:{pid}, similarity:{similarity_score}, difficulty:{difficulty_score}, score:{score}"
        )

        candidates.append((pid, doc, meta, score))

    return candidates


@router.post("/")
def recommend_problems(request: RecommendRequest) -> str:
    # 마지막으로 푼 문제의 type_def 조각 조회
    try:
        last = collection.get(
            ids=[f"{request.last_solved_problem_id}_type_def"]
        )
        logger.info("Fetched metadata for last solved problem")
        logger.debug(f"last: {last}")
    except Exception as e:
        logger.error(f"Error while fetching last problem metadata: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

    if not last["metadatas"]:
        logger.error(
            f"type_def 조각을 찾지 못함 (problem_id={request.last_solved_problem_id}). "
            "벡터DB가 섹션 단위로 적재되지 않았을 수 있음 -> reseed_vector_db.py 실행 필요"
        )
        raise HTTPException(status_code=404, detail="Data not found")

    last_meta = last["metadatas"][0]
    last_doc = last["documents"][0]

    last_category = last_meta["category"]
    last_difficulty = difficulty_to_int(last_meta["difficulty"])
    logger.debug(f"last_difficulty: {last_difficulty}")

    last_problem = next(
        (p for p in request.solved_problems if p.problem_id == request.last_solved_problem_id),
        None,
    )
    if not last_problem:
        logger.error("last_solved_problem_id is not in request.solved_problems")
        raise HTTPException(status_code=500, detail="Internal Server Error")

    efficiency = calculate_efficiency(last_problem, last_difficulty)

    if efficiency > E_THRESHOLD_HIGH:
        target_difficulty = min(last_difficulty + 1, 3)
    elif efficiency > E_THRESHOLD_MID:
        target_difficulty = last_difficulty
    else:
        target_difficulty = max(last_difficulty - 1, 1)

    logger.debug(f"efficiency: {efficiency}, target_difficulty: {target_difficulty}")

    results = collection.query(
        query_texts=[last_doc],
        n_results=N_RESULTS,
        where=TYPE_DEF_FILTER,
    )
    logger.debug(f"results: {[r['problem_id'] for r in results['metadatas'][0]]}")

    solved_ids = {p.problem_id for p in request.solved_problems}
    logger.debug(f"solved_ids: {solved_ids}")

    candidates = build_candidates(results, solved_ids, target_difficulty, last_category)

    if not candidates:
        results = collection.query(
            query_texts=[last_doc],
            n_results=N_RESULTS * 2,
            where=TYPE_DEF_FILTER,
        )
        logger.debug(f"{[r['problem_id'] for r in results['metadatas'][0]]}")
        candidates = build_candidates(results, solved_ids, target_difficulty, last_category)

    if not candidates:
        logger.info("No recommendable problems found")
        all_problems = collection.get(where=TYPE_DEF_FILTER)
        unsolved = [
            (p["problem_id"], p)
            for p in all_problems["metadatas"]
            if p["problem_id"] not in solved_ids
        ]
        if not unsolved:
            logger.info("case: All problem solved")
            return "모든 문제를 푸셨습니다. 더 이상 추천할 문제가 없습니다."

        selected = random.choice(unsolved)
        logger.info(
            f"case: Random recommended, problem_id={selected[0]}, title={selected[1]['title']}"
        )
        return selected[0]

    candidates.sort(key=lambda x: x[3], reverse=True)
    selected = candidates[0]
    logger.info(
        f"case: Fine, problem_id={selected[0]}, title={selected[2]['title']}, score={selected[3]}"
    )
    return selected[0]
