# /app/routers/wargames.py

from fastapi import APIRouter, HTTPException
from app.clients import genai_client, logger, collection
from app.models import WargameInformation

router = APIRouter(prefix="/wargame", tags=["wargame"])

def generate_type_definition(game: WargameInformation) -> str:
    prompt = f"""
    당신은 사이버 보안 전문가이자 취약점 분석가입니다.
    다음은 보안 워게임 문제에 대한 설명입니다. 이 문제의 핵심 취약점 유형과 그 원리를 벡터 검색(Semantic Search)에 최적화된 형태로 한 문장으로 정의하세요.
    조건:
    1. 취약점의 공식 명칭을 포함할 것.
    2. 해당 취약점이 발생하는 근본적인 원인(예: 검증 누락, 로직 결함 등)을 명시할 것.
    3. 다른 유사 취약점과 구분되는 이 문제만의 특징적인 키워드를 넣을 것.
    입력 데이터:
    - title: {game.title}
    - category: {game.category}
    - type: {game.type}
    - point: {game.point}
    - write-up: {game.writeup}
    출력 형식: [취약점 명칭]: [내용]
    출력 규칙: 마크다운 기호나 불릿 포인트 없이, 한 문장으로 작성할 것.
    출력 예시: "Insecure Direct Object Reference (IDOR): 서버가 클라이언트 요청 내의 식별자에 대한 소유권 검증을 누락하여, 공격자가 다른 사용자의 데이터에 접근할 수 있는 취약점."
    """
    response = genai_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    return response.text.strip()

def split_lines(text: str):
    return [
        line.strip()
        for line in text.split("\n")
        if line.strip()
    ]

@router.post("/")
def add_wargame(wargame: WargameInformation) -> dict:
    '''Add a wargame information to the collection'''
    type_definition = generate_type_definition(wargame)
    
    single_sections = [
        ("type_def", type_definition),
        ("point", wargame.point),
        ("write-up", wargame.writeup)
    ]
    
    multi_sections = [
        ("observation", wargame.observation),
        ("thinking", wargame.thinking),
        ("wrong", wargame.wrong)
    ]
    
    for sec_name, sec_content in single_sections:
        metadata = {
            "problem_id": wargame.problem_id,
            "title": wargame.title,
            "category": wargame.category.lower(),
            "type": wargame.type,
            "difficulty": wargame.difficulty,
            "section": sec_name
        }    
        
        try:
            collection.upsert(
                ids=[f"{wargame.problem_id}_{sec_name}"], # e.g. 6_thinking
                documents=[sec_content],
                metadatas=[metadata],
            )
        except Exception as e:
            logger.error(f"Error while adding wargame {wargame.problem_id} to the collection: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")
    
    for sec_name, sec_content in multi_sections:
        lines = split_lines(sec_content)
        
        for lidx, line in enumerate(lines):
            metadata = {
                "problem_id": wargame.problem_id,
                "title": wargame.title,
                "category": wargame.category.lower(),
                "type": wargame.type,
                "difficulty": wargame.difficulty,
                "section": sec_name,
                "line_index": lidx
            }    
        
            try:
                collection.upsert(
                    ids=[f"{wargame.problem_id}_{sec_name}_{lidx}"], # e.g. 6_thinking_1
                    documents=[line],
                    metadatas=[metadata],
                )
            except Exception as e:
                logger.error(f"Error while adding wargame {wargame.problem_id} to the collection: {e}")
                raise HTTPException(status_code=500, detail="Internal Server Error")
            
    logger.info(f"Wargame {wargame.problem_id} added to the collection.")
    return {"status": "success", "message": f"Wargame {wargame.problem_id} added."}
    
@router.get("/{problem_id}")
def get_wargame(problem_id: str):
    '''Retrieve wargame information by problem_id'''
    try:
        results = collection.get(
            where={"problem_id": problem_id}
        )

        if not results["documents"] or not results["documents"][0]:
            logger.error(f"Wargame {problem_id} not found in the collection.")
            raise HTTPException(status_code=404, detail="Wargame not found")

        data = []
        for idx, doc, meta in zip(
            results["ids"],
            results["documents"],
            results["metadatas"]
        ):
            data.append({
            "id": idx,
            "problem_id": meta.get("problem_id"),
            "section": meta.get("section"),
            "difficulty": meta.get("difficulty"),
            "content": doc
        })
        
        return {"data": data}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error while retrieving wargame {problem_id} from the collection: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
    
@router.delete("/{problem_id}")
def delete_wargame(problem_id: str) -> str:
    '''Delete wargame information by problem_id'''
    before_count = collection.count()
    try:
        collection.delete(
            where={"problem_id": problem_id}
        )
        
        after_count = collection.count()
        
        logger.info(f'problem_id: {problem_id}, {before_count-after_count} docs deleted.')
        return f'{before_count-after_count} docs deleted.'
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error while deleting wargame {problem_id} from the collection: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")