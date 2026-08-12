# update_vector_db.py
#
# [사용하지 않는다 — Gen1 방식]
#
# 이 스크립트는 id=problem_id 인 통짜 문서를 add 한다. 실행하면 해당 문제의
# 섹션 조각 구조가 깨지고 write-up 이 다시 힌트 컨텍스트로 새어 들어간다.
#
# 문제 데이터를 고칠 때는 build_vector_db_recom.py 의 wargames 를 수정한 뒤
# reseed_vector_db.py --apply 를 쓰고, wrong 만 고칠 때는
# update_wrong_chunks.py --apply 를 쓴다.
#
# Modify the content in 'new_contents' (line 51) to add or update problems.

import os
from dotenv import load_dotenv
import chromadb
from chromadb.utils import embedding_functions
from google import genai

# Load environment variables from .env file
load_dotenv(verbose=True)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
CHROMA_PATH = os.getenv("CHROMA_PATH")

# Initialize clients
genai_client = genai.Client(api_key=GEMINI_API_KEY,
                            http_options={'api_version': 'v1beta'})
chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)


# Define a custom embedding function using the Gemini embedding API
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
        
        return [e.values for e in response.embeddings]

embedding_function = GeminiEmbeddingFunction(genai_client)

# Load the existing ChromaDB collection
collection = chroma_client.get_collection(
    name="wargame_collection",
    embedding_function=embedding_function
)

# Update the collection with new documents
new_documents = []
new_metadatas = []
ids = []

new_contents = [ # here
    # {
    #     "problem_id": "...",
    #     "title": "...",
    #     "category": "...",
    #     "type": "...",
    #     "point": "...",
    #     "write-up": "...",
    #     "observation": "...",
    #     "thinking": "...",
    #     "wrong": "...",
    #     "difficulty": "..."
    # },
]

for content in new_contents:
    new_documents.append(
        f"""
        title: {content['title']}
        category: {content['category']}
        type: {content['type']}
        point: {content['point']}
        write-up: {content['write-up']}
        observation: {content['observation']}
        thinking: {content['thinking']}
        wrong: {content['wrong']}
        difficulty: {content['difficulty']}
        """
    )
    new_metadatas.append(content)
    ids.append(content['problem_id'])

collection.delete(ids=ids)
collection.add(
    ids=ids,
    documents=new_documents,
    metadatas=new_metadatas
)

# Retrieve the documents to confirm they were updated
print(collection.name)
print(collection.count())
print(collection.get(ids=ids))