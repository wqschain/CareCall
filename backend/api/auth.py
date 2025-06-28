from fastapi.security import OAuth2AuthorizationCodeBearer
from fastapi import Depends, HTTPException, status
import os
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from models.base import SessionLocal
from models.models import User
from schemas.schemas import UserCreate

oauth2_scheme = OAuth2AuthorizationCodeBearer(
    authorizationUrl=f"https://{os.getenv('AUTH0_DOMAIN')}/authorize",
    tokenUrl=f"https://{os.getenv('AUTH0_DOMAIN')}/oauth/token"
)

async def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        await db.close()

async def get_current_user(
    db: AsyncSession = Depends(get_db),
    auth0_id: Optional[str] = Depends(oauth2_scheme)
) -> User:
    if not auth0_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Try to get user from database
    user = await db.query(User).filter(User.auth0_id == auth0_id).first()

    # If user doesn't exist, create them
    if not user:
        # Get user info from Auth0
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://{os.getenv('AUTH0_DOMAIN')}/userinfo",
                headers={"Authorization": f"Bearer {auth0_id}"}
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Could not validate credentials",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            user_info = response.json()

        # Create new user
        new_user = UserCreate(
            auth0_id=auth0_id,
            email=user_info["email"],
            name=user_info.get("name", "")
        )
        db_user = User(**new_user.dict())
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        return db_user

    return user 