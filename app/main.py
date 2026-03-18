# app/main.py

import os
from dotenv import load_dotenv
import chromadb
from chromadb.utils import embedding_functions
from google import genai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from app.models import ProblemSolvingHistory, LogEntry, HintRequest
from app.logging_config import setup_logging

# Set up logging
logger = setup_logging()

# Load environment variables from .env file
load_dotenv(verbose=True)

def get_env(variable: str) -> str:
    value = os.getenv(variable)
    if not value:
        logger.critical(f"{variable} is not found in environment variables.")
        raise RuntimeError(f"{variable} is not found")
    return value

GEMINI_API_KEY = get_env("GEMINI_API_KEY")
CHROMA_PATH = get_env("CHROMA_PATH")

CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
                if o.strip()]
if not CORS_ORIGINS:
    logger.warning("CORS_ORIGINS is not set or empty. Defaulting to http://localhost:3000.")
    CORS_ORIGINS = ["http://localhost:3000"]

logger.info("Environment variables loaded successfully.")

# Initialize FastAPI app
app = FastAPI(title="AI Tutor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize clients
genai_client = genai.Client(api_key=GEMINI_API_KEY, 
                            http_options={'api_version': 'v1beta'})
chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
logger.info("Clients initialized successfully.")

# Define a custom embedding function to connect Gemini embedding model with ChromaDB
class GeminiEmbeddingFunction(embedding_functions.EmbeddingFunction):
    def __init__(self, client):
        self.client = client
        self.model_name = "models/gemini-embedding-001"

    def __call__(self, input):
        if isinstance(input, str):
            input = [input]

        response = self.client.models.embed_content(
            model=self.model_name,
            contents=input
        )
        
        logger.info("Embeddings generated successfully.")
        return [e.values for e in response.embeddings]

embedding_function = GeminiEmbeddingFunction(genai_client)

# Load the existing ChromaDB collection
collection = chroma_client.get_collection(
    name="wargame_collection",
    embedding_function=embedding_function
)
logger.info("ChromaDB collection loaded successfully.")

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

# Generate a contextual hint based on user logs and problem history
@app.post("/hint")
def get_hint(request: HintRequest)-> str:
    query_text = "".join(user_logs_to_str(request.logs))
    logger.debug(f"Query texts: {query_text}")
        
    try:
        search_results = collection.query(
            query_texts=query_text,
            n_results=1,
            where={"problem_id": request.problem_id}
        )

        if not search_results["documents"] or not search_results["documents"][0]:
            logger.error("No relevant data found")
            raise HTTPException(status_code=404, detail="Data not found")

        context = search_results["documents"][0][0]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error while querying ChromaDB: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
    
    level = calculate_level(request.hint_count, request.history)

    prompt = f"""
당신은 보안 워게임 튜터입니다.
다음 참고 자료를 바탕으로 사용자의 행동에 대해 정답을 직접 말하지 말고
보안 사고를 유도할 수 있는 질문을 던지세요.

출력은 마크다운 구문을 모두 제거하고 일반 텍스트 Plain text로만
최대 500자 이내로 간결하게 작성하세요.
줄바꿈 문자는 사용하지 마세요.

<참고 자료 용어 설명>
type : 문제 유형
category : 문제 세부 유형
title : 문제 제목
point : 문제의 본질 요약
write-up : 모범 풀이 절차
observation : 관찰 포인트
thinking : 사고 유도 질문
wrong : 잘못된 접근

<Level 가이드>
Level 1 : 관찰 유도, observation 기반 질문, 취약점 이름 언급 금지
Level 2 : 사고 유도, thinking 기반 질문, 취약점 이름 언급 금지
Level 3 : 행동 제안, write-up 기반 질문, 취약점의 개념적 특징 언급
Level 4 : 핵심 직전 힌트, point 간접 설명, 취약점 이름 언급 가능

현재 힌트 단계는 Level {level} 입니다.

참고 자료: {context}
사용자 상황: {query_text}
"""

    if request.history.previous_hint:
            prompt += f"\n직전에 제공된 힌트: {request.history.previous_hint} 이것보다 조금만 더 알려주세요."

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