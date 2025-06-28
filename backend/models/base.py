from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from typing import AsyncGenerator
import os
import logging
from pathlib import Path
from dotenv import load_dotenv
import asyncio
from sqlalchemy import text

# Load environment variables
load_dotenv(verbose=True)

logger = logging.getLogger("carecall")

async def wait_for_db(engine, max_retries=5, retry_interval=5):
    """Wait for database to be ready"""
    for attempt in range(max_retries):
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
                await conn.commit()
                logger.info("Database connection successful")
                return True
        except Exception as e:
            if attempt < max_retries - 1:
                logger.warning(f"Database connection attempt {attempt + 1} failed: {str(e)}")
                await asyncio.sleep(retry_interval)
            else:
                logger.error(f"Failed to connect to database after {max_retries} attempts")
                raise

def get_database_url() -> str:
    """
    Constructs the database URL based on environment.
    Handles both local development and Cloud SQL connections.
    """
    # Get base Database URL
    database_url = os.getenv("DATABASE_URL")
    logger.debug(f"Raw DATABASE_URL from env: {database_url}")
    
    if not database_url:
        # Local development fallback to SQLite
        # Ensure data directory exists
        data_dir = Path("data")
        data_dir.mkdir(exist_ok=True)
        fallback_url = "sqlite+aiosqlite:///./data/carecall.db"
        logger.debug(f"Using fallback SQLite URL: {fallback_url}")
        return fallback_url
    
    try:
        # For Cloud SQL with Unix socket
        if "/cloudsql/" in database_url:
            logger.info("Using Cloud SQL Unix socket connection")
            # Ensure the URL is properly formatted for Unix socket
            if "?host=" in database_url:
                base_url, socket_path = database_url.split("?host=")
                return f"{base_url}?host={socket_path}"
            return database_url
        
        logger.info("Using standard database connection")
        return database_url
    except Exception as e:
        logger.error(f"Error parsing database URL: {str(e)}")
        raise

def get_engine_args():
    """Get engine arguments based on database type"""
    url = get_database_url()
    logger.debug(f"Database URL for engine args: {url}")
    args = {
        "echo": os.getenv("SQL_ECHO", "false").lower() == "true",
        "future": True,  # Use SQLAlchemy 2.0 style
        "pool_pre_ping": True,  # Enable connection health checks
    }
    
    # Add pooling settings only for PostgreSQL
    if "postgresql" in url:
        logger.debug("Using PostgreSQL engine args")
        args.update({
            "pool_size": int(os.getenv("DB_POOL_SIZE", "5")),
            "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", "10")),
            "pool_timeout": int(os.getenv("DB_POOL_TIMEOUT", "30")),
            "pool_recycle": int(os.getenv("DB_POOL_RECYCLE", "1800")),
        })
    elif "sqlite" in url:
        # SQLite-specific settings
        logger.debug("Using SQLite engine args")
        args.update({
            "connect_args": {"check_same_thread": False},
        })
    
    return args

# Create async engine with proper configuration
engine = create_async_engine(
    get_database_url(),
    **get_engine_args()
)

# Create async session factory
SessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Create declarative base
Base = declarative_base()

# Async session dependency
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    try:
        async with SessionLocal() as session:
            # Test the connection
            async with session.begin():
                await session.execute(text("SELECT 1"))
            logger.debug("Database session created successfully")
            yield session
    except Exception as e:
        logger.error(f"Error in database session: {str(e)}")
        raise 