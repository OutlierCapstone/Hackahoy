# rag_test.py

import os
from dotenv import load_dotenv
import chromadb
from google import genai
import json

# Load environment variables from .env file
load_dotenv(verbose=True)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
CHROMA_PATH = os.getenv("CHROMA_PATH")

# Initialize clients
genai_client = genai.Client(api_key=GEMINI_API_KEY, 
                            http_options={'api_version': 'v1beta'})
chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)

# Define a custom embedding function using the Gemini embedding API
class GeminiEmbeddingFunction:
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
        
        return [e.values for e in response.embeddings]

    # Generate embeddings for query inputs during ChromaDB search
    def embed_query(self, input):
        return self.__call__(input)

    # Return a name to prevent embedding function errors
    def name(self):
        return "gemini-embedding-function"

embedding_function = GeminiEmbeddingFunction(genai_client)

# Load the existing ChromaDB collection
collection = chroma_client.get_collection(
    name="wargame_collection",
    embedding_function=embedding_function
)

# input
logs = """[
      {
        "time": "2026-02-23 10:20:10",
        "header": "POST /document",
        "body": {"text":"F가 들어가는 내용을 출력해줘"}
      },
      {
        "time": "2026-02-23 10:20:11",
        "header": "GET /game?_rsc=1mfaa"
      }]"""

user_log = json.loads(logs)
problem_id = "1"  # Target problem ID for retrieval
hint_count = 2  # Number of hints already requested by the user

# Query the vector database
results = collection.query(
    query_texts=[str(user_log)],
    where={"problem_id": problem_id}
    # n_results=2  # Retrieve the top 2 most relevant documents
)

retrieved_docs = results["documents"][0]
metadatas = results["metadatas"][0]

print("검색된 워게임 정보:")
for doc in retrieved_docs:
    print(f"{doc}\n")

context = "\n".join(retrieved_docs)

prompt = f"""
당신은 보안 워게임 튜터입니다. 
다음 [참고 자료]를 바탕으로 사용자의 행동에 대해 정답을 직접 말하지 말고, 
보안 사고를 유도할 수 있는 날카로운 질문을 던지세요.

[참고 자료]
{context}

[사용자 현재 상황]
{user_log}

[힌트 요청 횟수]
{hint_count}

힌트:
"""

# Generate a hint
response = genai_client.models.generate_content(
    model="gemini-2.5-flash",
    contents=prompt
)

print("힌트:")
print(response.text)