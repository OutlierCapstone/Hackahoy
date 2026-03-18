# /app/clients.py

import os
from dotenv import load_dotenv
import chromadb
from chromadb.utils import embedding_functions
from google import genai
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