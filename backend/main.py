from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt, JWTError
import httpx
from typing import Optional
import os

from models.base import engine, Base
from api import recipients, checkins, auth

app = FastAPI(title="CareCall API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://carecall.club",
        "https://www.carecall.club"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth0 configuration
AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN")
AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE")
ALGORITHMS = ["RS256"]

# Cache for JWKS
jwks = None

async def get_jwks():
    global jwks
    if not jwks:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"https://{AUTH0_DOMAIN}/.well-known/jwks.json")
            jwks = response.json()
    return jwks

async def verify_token(token: str = Depends(auth.oauth2_scheme)) -> Optional[str]:
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
        if rsa_key:
            try:
                payload = jwt.decode(
                    token,
                    rsa_key,
                    algorithms=ALGORITHMS,
                    audience=AUTH0_AUDIENCE,
                    issuer=f"https://{AUTH0_DOMAIN}/"
                )
                return payload["sub"]
            except JWTError:
                return None
    except Exception:
        return None
    return None

# Include routers
app.include_router(recipients.router, prefix="/api", tags=["recipients"])
app.include_router(checkins.router, prefix="/api", tags=["check-ins"])
app.include_router(auth.router, prefix="/api", tags=["auth"])

# Create database tables
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/")
async def root():
    return {"message": "Welcome to CareCall API"} 