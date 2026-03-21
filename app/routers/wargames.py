# /app/routers/wargames.py

from fastapi import APIRouter, HTTPException
from app.clients import logger, collection
from app.models import WargameInformation

router = APIRouter(prefix="/wargame", tags=["wargame"])

@router.post("/")
def add_wargame(wargame: WargameInformation) -> dict:
    '''Add a wargame information to the collection'''
    doc_text = f"""
        title: {wargame.title}
        category: {wargame.category}
        type: {wargame.type}
        point: {wargame.point}
        write-up: {wargame.writeup}
        observation: {wargame.observation}
        thinking: {wargame.thinking}
        wrong: {wargame.wrong}
        difficulty: {wargame.difficulty}
        """
    try:
        collection.add(
            documents=[doc_text],
            metadatas=[wargame.model_dump()],
            ids=[wargame.problem_id]
        )
        logger.info(f"Wargame {wargame.problem_id} added to the collection.")
        return {"status": "success", "message": f"Wargame {wargame.problem_id} added."}
    except Exception as e:
        logger.error(f"Error while adding wargame {wargame.problem_id} to the collection: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
    
@router.get("/{problem_id}")
def get_wargame(problem_id: str) -> WargameInformation:
    '''Retrieve wargame information by problem_id'''
    try:
        search_results = collection.query(
            query_texts="1", # Dummy query to retrieve by metadata filter
            n_results=1,
            where={"problem_id": problem_id}
        )

        if not search_results["documents"] or not search_results["documents"][0]:
            logger.error(f"Wargame {problem_id} not found in the collection.")
            raise HTTPException(status_code=404, detail="Wargame not found")

        wargame_info = search_results["metadatas"][0][0]
        
        return wargame_info

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error while retrieving wargame {problem_id} from the collection: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")