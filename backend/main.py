from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from dotenv import load_dotenv
import logging
from models.base import engine, Base, wait_for_db
from api import email_auth, recipients, checkins
import sys
from sqlalchemy import text

# Load environment variables
load_dotenv(verbose=True)

# Configure logging
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "DEBUG").upper(),  # Set default to DEBUG for more info
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s - %(pathname)s:%(lineno)d',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("carecall")

# Debug: Print environment variables and configuration
logger.debug("Environment Configuration:")
logger.debug(f"RESEND_API_KEY set: {'RESEND_API_KEY' in os.environ}")
logger.debug(f"JWT_SECRET set: {'JWT_SECRET' in os.environ}")
logger.debug(f"LOG_LEVEL: {os.getenv('LOG_LEVEL')}")
logger.debug(f"Current working directory: {os.getcwd()}")

app = FastAPI(title="CareCall API")

# Configure CORS with logging
origins = [
    "http://localhost:3000",
    "https://carecall.club",
    "https://www.carecall.club",
    "https://6271-141-117-117-63.ngrok-free.app",  # Updated ngrok URL
    "http://localhost:3001",  # In case you're running Next.js on a different port
]

logger.debug(f"Configured CORS origins: {origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.debug(f"Incoming request: {request.method} {request.url}")
    logger.debug(f"Request headers: {request.headers}")
    response = await call_next(request)
    logger.debug(f"Response status: {response.status_code}")
    return response

# Health check endpoint
@app.get("/health")
async def health_check():
    try:
        # Test database connection
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            await conn.commit()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=503, detail="Database connection failed")

# Include routers
app.include_router(email_auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(recipients.router, prefix="/api/recipients", tags=["recipients"])
app.include_router(checkins.router, prefix="/api", tags=["checkins"])

# Serve static files (for generated audio)
app.mount("/media", StaticFiles(directory="media"), name="media")

# Create database tables
@app.on_event("startup")
async def startup():
    try:
        logger.info("Starting application...")
        
        # Verify environment variables
        required_vars = ["JWT_SECRET", "RESEND_API_KEY"]
        missing_vars = [var for var in required_vars if not os.getenv(var)]
        if missing_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")
        
        # Create required directories
        for dir_path in ["media", "data"]:
            try:
                os.makedirs(dir_path, exist_ok=True)
                logger.info(f"Created directory: {dir_path}")
            except Exception as e:
                logger.warning(f"Could not create directory {dir_path}: {str(e)}")
        
        # Wait for database to be ready
        await wait_for_db(engine)
            
        # Create database tables
        async with engine.begin() as conn:
            logger.info("Creating database tables...")
            await conn.run_sync(Base.metadata.create_all)
            
        print(f"[CareCall Startup] Vertex AI Project: {os.getenv('GCP_PROJECT_ID')}")
        print(f"[CareCall Startup] Vertex AI Region: {os.getenv('GCP_REGION')}")
        
        logger.info("Application startup complete")
    except Exception as e:
        logger.error(f"Startup failed: {str(e)}")
        raise

@app.on_event("shutdown")
async def shutdown():
    try:
        logger.info("Shutting down application...")
        await engine.dispose()
        logger.info("Application shutdown complete")
    except Exception as e:
        logger.error(f"Shutdown error: {str(e)}")
        raise

@app.get("/")
async def root():
    return {"message": "Welcome to CareCall API"} 