# backend/main.py

from fastapi import FastAPI
from pydantic import BaseModel
import httpx
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Chatbot Server")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # 프론트 주소
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
ollama_url = "http://localhost:11434/api/chat" 
model_name = "llama3.2-bllossom-kor-3B" # ollama create로 지정한 모델 이름

# 클라이언트로부터 받을 데이터 구조
class ChatRequest(BaseModel):
    question: str

# 클라이언트로 돌려줄 데이터 구조
class ChatResponse(BaseModel):
    answer: str

@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_ollama(request: ChatRequest):
    payload = {
        "model": model_name,
        "messages": [
            {"role": "user", "content": request.question}
        ],
        "stream": False    # 스트리밍을 끄면 한 번에 응답
    }

    async with httpx.AsyncClient() as client:
        try:
        # Ollama 서버에 요청 전달
            response = await client.post(ollama_url, json=payload, timeout=60.0)
            response.raise_for_status()
        except httpx.HTTPError as e:
            return ChatResponse(
                answer=f"Error communicating with Ollama server: {str(e)}"
            )
        
        result = response.json()
        content = result.get("message",{}).get("content", "")
        
        if not content:
            content = "어이, 이번에 내가 말을 제대로 못 들은 것 같다."
        
        return ChatResponse(answer=content)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)