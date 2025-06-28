from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from typing import AsyncGenerator
import os

# Get database URL from environment
# Format: postgresql+asyncpg://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:carecall-password-123@34.75.166.86:5432/carecall"
)

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=True,
    future=True,  # Use SQLAlchemy 2.0 style
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
    async with SessionLocal() as session:
        yield session 