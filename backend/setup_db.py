import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from models.base import Base
from models.models import User, Recipient, CheckIn  # Import all models
import os

# Get database URL from environment
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:carecall-password-123@34.75.166.86:5432/carecall"
)

async def setup_database():
    # Create async engine
    engine = create_async_engine(
        DATABASE_URL,
        echo=True  # Show SQL commands
    )
    
    async with engine.begin() as conn:
        # Drop all tables if they exist
        await conn.run_sync(Base.metadata.drop_all)
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
        
    await engine.dispose()

if __name__ == "__main__":
    print("Setting up database...")
    asyncio.run(setup_database())
    print("Database setup complete!") 