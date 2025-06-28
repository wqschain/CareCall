from fastapi.security import OAuth2AuthorizationCodeBearer
from fastapi import Depends, HTTPException, status, Security, APIRouter
from jose import jwt, JWTError
import os
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
import httpx
from sqlalchemy import select

from models.base import SessionLocal
from models.models import User
from schemas.schemas import UserCreate

router = APIRouter()

# Auth0 configuration
AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN")
AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE")
ALGORITHMS = ["RS256"]

oauth2_scheme = OAuth2AuthorizationCodeBearer(
    authorizationUrl=f"https://{AUTH0_DOMAIN}/authorize",
    tokenUrl=f"https://{AUTH0_DOMAIN}/oauth/token"
)

# Cache for JWKS
_jwks = None

async def get_jwks():
    global _jwks
    if not _jwks:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"https://{AUTH0_DOMAIN}/.well-known/jwks.json")
            _jwks = response.json()
    return _jwks

async def verify_token(token: str) -> dict:
    try:
        jwks = await get_jwks()
        unverified_header = jwt.get_unverified_header(token)
        rsa_key = {}
        
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "n": key["n"],
                    "e": key["e"]
                }
                break
        
        if not rsa_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unable to find appropriate key",
                headers={"WWW-Authenticate": "Bearer"},
            )

        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=ALGORITHMS,
            audience=AUTH0_AUDIENCE,
            issuer=f"https://{AUTH0_DOMAIN}/"
        )
        
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def requires_permissions(required_permissions: List[str]):
    async def permission_dependency(token: str = Security(oauth2_scheme)):
        try:
            payload = await verify_token(token)
            token_permissions = payload.get("permissions", [])
            
            for permission in required_permissions:
                if permission not in token_permissions:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Missing required permission: {permission}",
                    )
            return token
        except HTTPException:
            raise
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
        payload = await verify_token(token)
        auth0_id = payload.get("sub")
        
        if not auth0_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user identifier",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Try to get user from database
        result = await db.execute(
            select(User).where(User.auth0_id == auth0_id)
        )
        user = result.scalar_one_or_none()

        # If user doesn't exist, create them
        if not user:
            # Get user info from Auth0
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"https://{AUTH0_DOMAIN}/userinfo",
                    headers={"Authorization": f"Bearer {token}"}
                )
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Could not fetch user info",
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) 