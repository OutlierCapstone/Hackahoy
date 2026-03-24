# retrieve.py

import os
from dotenv import load_dotenv
import chromadb
from chromadb.utils import embedding_functions
from google import genai

# Load environment variables from .env file
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
CHROMA_PATH = os.getenv("CHROMA_PATH")

# Initialize clients
genai_client = genai.Client(api_key=GEMINI_API_KEY, 
                            http_options={'api_version': 'v1beta'})
chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)

# Define a custom embedding function using the Gemini embedding API
# It receives a list of strings and returns their embeddings.
class GeminiEmbeddingFunction(embedding_functions.EmbeddingFunction):
    
    # Specify the embedding model
    def __init__(self, client):
        self.client = client
        self.model_name = "models/gemini-embedding-001"

    def __call__(self, input):
        # Convert a single string input into a list
        if isinstance(input, str):
            input = [input]
            
        # Call the Gemini API to get embeddings
        response = self.client.models.embed_content(
            model=self.model_name,
            contents=input
        )
        
        # Extract embedding vectors from the response
        return [e.values for e in response.embeddings]

embedding_function = GeminiEmbeddingFunction(genai_client)

# Create the ChromaDB collection
collection = chroma_client.get_collection(
    name="problems",
    embedding_function=embedding_function
)

print(collection.name)
print(collection.count())
print(collection.get())