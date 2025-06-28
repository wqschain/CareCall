from fastapi.security import OAuth2AuthorizationCodeBearer
from fastapi import Depends, HTTPException, status, Security, APIRouter
from jose import jwt
import os
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from models.base import SessionLocal
from models.models import User
from schemas.schemas import UserCreate

router = APIRouter()

oauth2_scheme = OAuth2AuthorizationCodeBearer(
    authorizationUrl=f"https://{os.getenv('AUTH0_DOMAIN')}/authorize",
    tokenUrl=f"https://{os.getenv('AUTH0_DOMAIN')}/oauth/token"
)

def requires_permissions(required_permissions: List[str]):
    async def permission_dependency(token: str = Security(oauth2_scheme)):
        try:
            # Decode token without verification to get permissions
            unverified_claims = jwt.get_unverified_claims(token)
            token_permissions = unverified_claims.get("permissions", [])
            
            # Check if all required permissions are present
            for permission in required_permissions:
                if permission not in token_permissions:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Missing required permission: {permission}",
                    )
            return token
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Could not validate permissions",
            )
    return permission_dependency

@router.get("/test-permissions")
async def test_permissions(token: str = Security(oauth2_scheme)):
    """
    Test endpoint to decode and display permissions from the access token
    """
    try:
        # Decode token without verification to get permissions
        decoded = jwt.get_unverified_claims(token)
        return {
            "permissions": decoded.get("permissions", []),
            "sub": decoded.get("sub"),
            "azp": decoded.get("azp"),
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

async def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        await db.close()

async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    try:
        # Decode token without verification to get the sub claim
        payload = jwt.get_unverified_claims(token)
        auth0_id = payload.get("sub")
        
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
                    headers={"Authorization": f"Bearer {token}"}
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
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) 