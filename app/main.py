# /app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import hints, wargames, recommendations
from app.clients import CORS_ORIGINS
   
# Initialize FastAPI app
app = FastAPI(title="AI Tutor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(hints.router)
app.include_router(wargames.router)
app.include_router(recommendations.router)