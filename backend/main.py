from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import logging
from models.base import engine, Base
from api import email_auth, recipients, checkins

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("carecall")

app = FastAPI(title="CareCall API")

# Ensure media and data directories exist
os.makedirs("media", exist_ok=True)
os.makedirs("data", exist_ok=True)

# Mount media directory
app.mount("/media", StaticFiles(directory="media"), name="media")

# Configure CORS
origins = [
    "http://localhost:3000",
    "https://carecall.club",
    "https://www.carecall.club",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include routers
app.include_router(email_auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(recipients.router, prefix="/api/recipients", tags=["recipients"])
app.include_router(checkins.router, prefix="/api/checkins", tags=["checkins"])

# Create database tables
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/")
async def root():
    return {"message": "Welcome to CareCall API"} 