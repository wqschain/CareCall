from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import jwt
from datetime import datetime, timedelta
import os
from typing import Optional
import secrets
import resend
import logging
from dotenv import load_dotenv

from models.base import SessionLocal
from models.models import User
from schemas.schemas import UserCreate, EmailLoginRequest, VerifyCodeRequest

# Load environment variables
load_dotenv(verbose=True)

router = APIRouter()
security = HTTPBearer()
logger = logging.getLogger("carecall")

# Initialize Resend
api_key = os.getenv("RESEND_API_KEY")
if not api_key:
    logger.error("RESEND_API_KEY environment variable is not set")
    raise ValueError("RESEND_API_KEY environment variable is required")

resend.api_key = api_key

# JWT settings
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")  # Change in production
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Store verification codes (in production, use Redis or similar)
verification_codes = {}

# Rate limiting (in production, use Redis or similar)
rate_limits = {}

async def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        await db.close()

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email = payload.get("sub")
        if not email:
            logger.warning(f"Invalid token: missing email in payload")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
        
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if not user:
            logger.warning(f"User not found for email: {email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        return user
    except jwt.ExpiredSignatureError:
        logger.warning("Token expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.JWTError as e:
        logger.error(f"JWT error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

@router.post("/login/email")
async def login_email(email: EmailLoginRequest, db: AsyncSession = Depends(get_db)):
    """Start email login process by sending verification code"""
    logger.info(f"Login attempt for email: {email.email}")
    logger.debug(f"Using Resend API key: {api_key[:5]}...")  # Only log first 5 chars for security
    
    # Check rate limit (max 5 attempts per 15 minutes)
    now = datetime.utcnow()
    if email.email in rate_limits:
        attempts = rate_limits[email.email]
        # Clean up old attempts
        attempts = [t for t in attempts if now - t < timedelta(minutes=15)]
        if len(attempts) >= 5:
            logger.warning(f"Rate limit exceeded for email: {email.email}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many verification code requests. Please wait 15 minutes."
            )
        rate_limits[email.email] = attempts + [now]
    else:
        rate_limits[email.email] = [now]

    # Generate verification code (4 digits for better readability)
    code = ''.join([str(secrets.randbelow(10)) for _ in range(4)])
    verification_codes[email.email] = {
        "code": code,
        "expires": now + timedelta(minutes=15)
    }
    
    # Send email
    try:
        logger.debug("Attempting to send email via Resend...")
        params = {
            "from": "noreply@carecall.club",  # Using verified domain
            "to": [email.email],
            "subject": "Your CareCall Login Code",
            "html": f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {{
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                        }}
                        .container {{
                            background: #ffffff;
                            border-radius: 8px;
                            padding: 30px;
                            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                        }}
                        .logo {{
                            font-size: 24px;
                            font-weight: bold;
                            color: #1a1a1a;
                            margin-bottom: 20px;
                        }}
                        .code {{
                            font-size: 32px;
                            font-weight: bold;
                            color: #2563eb;
                            letter-spacing: 4px;
                            padding: 16px;
                            background: #f3f4f6;
                            border-radius: 4px;
                            margin: 20px 0;
                            text-align: center;
                        }}
                        .footer {{
                            font-size: 14px;
                            color: #666;
                            margin-top: 30px;
                            text-align: center;
                        }}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="logo">CareCall</div>
                        <h1>Welcome to CareCall!</h1>
                        <p>Here's your verification code to complete your login:</p>
                        <div class="code">{code}</div>
                        <p>This code will expire in 15 minutes for security reasons.</p>
                        <p>If you didn't request this code, please ignore this email.</p>
                        <div class="footer">
                            <p>CareCall - Automated Care Check-ins</p>
                            <p>This is an automated message, please do not reply.</p>
                        </div>
                    </div>
                </body>
                </html>
            """
        }
        resend.Emails.send(params)
        logger.info(f"Verification code sent to: {email.email}")
        return {"message": "Verification code sent"}
    except Exception as e:
        logger.error(f"Failed to send verification code to {email.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send verification code: {str(e)}"
        )

# Create a reusable verify function
async def _verify_code(verify_data: VerifyCodeRequest, db: AsyncSession) -> dict:
    """Internal function to verify code and return access token"""
    email = verify_data.email
    code = verify_data.code
    
    logger.info(f"Verifying code for email: {email}")
    logger.debug(f"Received code: {code}")
    
    if email not in verification_codes:
        logger.warning(f"No verification code found for email: {email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No verification code found for this email"
        )
    
    stored = verification_codes[email]
    logger.debug(f"Stored verification data: {stored}")
    
    if datetime.utcnow() > stored["expires"]:
        logger.warning(f"Verification code expired for email: {email}")
        del verification_codes[email]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired"
        )
    
    if stored["code"] != code:
        logger.warning(f"Invalid verification code for email: {email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code"
        )
    
    # Code is valid, create or get user
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user:
        user = User(email=email)
        db.add(user)
        await db.commit()
        await db.refresh(user)
    
    # Generate access token
    access_token = create_access_token({"sub": user.email})
    logger.info(f"Generated access token for user: {email}")
    
    # Clean up used code
    del verification_codes[email]
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": user.name
        }
    }

@router.post("/verify")
@router.post("/email/verify")
async def verify_code(verify_data: VerifyCodeRequest, db: AsyncSession = Depends(get_db)):
    """Verify email code and return access token"""
    return await _verify_code(verify_data, db)

@router.get("/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
) -> dict:
    """Get current user information"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name
    } 