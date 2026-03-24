# /app/routers/recommendations.py

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

def difficulty_to_int(diff: str) -> int:
    mapping = {"하": 1, "중": 2, "상": 3}
    return mapping.get(diff, 1) # Default to "하" if not found

def calculate_efficiency(solved_problem: SolvedProblemInformation, difficulty: int) -> float:
    if solved_problem.time_spent <= 0:
        return 0
    return difficulty / (solved_problem.time_spent * (solved_problem.hint_count + 1))

def build_candidates(results, solved_ids, target_difficulty, last_category):
    candidates = []
        
    for doc, meta, dist in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0]
    ):
        pid = meta["problem_id"]

        if pid in solved_ids:
            continue

        similarity_score = max(0, 1 - dist); 
        
        difficulty = difficulty_to_int(meta["difficulty"])
        diff_penalty = abs(difficulty - target_difficulty)
        difficulty_score = 1 / (1 + diff_penalty)
        
        score = similarity_score * SIM_WEIGHT + difficulty_score * DIFF_WEIGHT 
        
        if meta["category"] == last_category :
            score += CAT_BONUS
            
        logger.debug(f"pid:{pid}, similarity score:{similarity_score}, difficulty_score:{difficulty_score}, score:{score}")
        
        candidates.append((pid, doc, meta, score))
        
    return candidates
    
@router.post("/")
def recommend_problems(request: RecommendRequest)->str:
    # Find the last solved problem's metadata
    try:
        last = collection.get(
            ids=[f"{request.last_solved_problem_id}_type_def"]
        )
        logger.info(f"Fetched metadata for last solved problem")
        logger.debug(f"last: {last}")
    except Exception as e:
        logger.error(f"Error while fetching last problem metadata: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
    
    last_meta = last["metadatas"][0]
    last_doc = last["documents"][0]
    
    last_category = last_meta["category"]
    last_difficulty = difficulty_to_int(last_meta["difficulty"])
    logger.debug(f"last_difficulty: {last_difficulty}")
    
    last_problem = next(
        (p for p in request.solved_problems if p.problem_id == request.last_solved_problem_id),
        None
    )
    if not last_problem:
        logger.error(f"last_solved_problem_id is not in request.solved_problems")
        raise HTTPException(status_code=500, detail="Internal Server Error")
    
    # Calculate efficiency
    efficiency = calculate_efficiency(last_problem, last_difficulty)
    
    # Set target difficulty
    if efficiency > E_THRESHOLD_HIGH: 
        target_difficulty = min(last_difficulty + 1, 3)
    elif efficiency > E_THRESHOLD_MID:
        target_difficulty = last_difficulty
    else:
        target_difficulty = max(last_difficulty - 1, 1)
        
    logger.debug(f"efficiency: {efficiency}, target_difficulty: {target_difficulty}")
    
    # Query
    results = collection.query(
        query_texts=[last_doc],
        n_results=N_RESULTS,
        where={
            "section": "type_def"
            # "$and":[
            #     {"section": "type_def"},
            #     {"category": last_category}
            # ] # 논의 끝에 category 제한하지 x
        }
    )
    results_problem_ids = [r["problem_id"] for r in results["metadatas"][0]] # for debugging
    logger.debug(f"results: {results_problem_ids}")

    solved_ids = {p.problem_id for p in request.solved_problems}
    logger.debug(f"solved_ids: {solved_ids}")
    
    candidates = build_candidates(results, solved_ids, target_difficulty, last_category)
    
    if not candidates:
        results = collection.query(
        query_texts=[last_doc],
        n_results=N_RESULTS*2,
        where={"section": "type_def"}
        )
        results_problem_ids = [r["problem_id"] for r in results["metadatas"][0]] # for debugging
        logger.debug(f"{results_problem_ids}")

        candidates = build_candidates(results, solved_ids, target_difficulty, last_category)

    if not candidates:
        logger.info(f"No recommendable problems found")
        all_problems = collection.get(where={"section":"type_def"})
        unsolved = [(p["problem_id"], p)
                    for p in all_problems["metadatas"]
                    if p["problem_id"] not in solved_ids
                ]
        if not unsolved:
            logger.info("case: All problem solved")
            return "모든 문제를 푸셨습니다. 더 이상 추천할 문제가 없습니다."
        
        selected = random.choice(unsolved)
        logger.info(f"case: Random recommended, recommended_problem_id : {selected[0]}, title : {selected[1]['title']}")
        logger.info(f"difficulty : {selected[1]['difficulty']}, target_difficulty : {target_difficulty}")
        return selected[0]
    
    candidates.sort(key=lambda x: x[3], reverse=True)
    selected = candidates[0]
    logger.info(f"case: Fine, recommended_problem_id : {selected[0]}, title : {selected[2]['title']}")
    logger.info(f"difficulty : {selected[2]['difficulty']}, target_difficulty : {target_difficulty}, score : {selected[3]}")
    return selected[0]