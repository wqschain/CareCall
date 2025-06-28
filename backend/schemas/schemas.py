from datetime import datetime
from typing import Optional, List, Annotated
from pydantic import BaseModel, EmailStr, Field

from models.models import CheckInStatus

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class EmailLoginRequest(BaseModel):
    email: EmailStr

class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str

class RecipientBase(BaseModel):
    name: str
    phone_number: Annotated[str, Field(pattern=r'^\+?1?\d{9,15}$')]
    condition: str
    preferred_time: str  # HH:MM in UTC
    emergency_contact_name: str
    emergency_contact_phone: Annotated[str, Field(pattern=r'^\+?1?\d{9,15}$')]
    emergency_contact_email: EmailStr

class RecipientCreate(RecipientBase):
    pass

class Recipient(RecipientBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CheckInBase(BaseModel):
    status: str  # OK, CONCERN, EMERGENCY, NO_ANSWER
    transcript: Optional[str] = None
    summary: Optional[str] = None
    audio_url: Optional[str] = None
    metadata: Optional[dict] = None

class CheckInCreate(CheckInBase):
    recipient_id: int

class CheckIn(CheckInBase):
    id: int
    recipient_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserBase 