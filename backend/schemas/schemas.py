from datetime import datetime
from typing import Optional, List, Annotated
from pydantic import BaseModel, EmailStr, Field

from models.enums import CheckInStatus

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

class RecipientUpdate(BaseModel):
    name: Optional[str] = None
    phone_number: Optional[Annotated[str, Field(pattern=r'^\+?1?\d{9,15}$')]] = None
    condition: Optional[str] = None
    preferred_time: Optional[str] = None  # HH:MM in UTC
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[Annotated[str, Field(pattern=r'^\+?1?\d{9,15}$')]] = None
    emergency_contact_email: Optional[EmailStr] = None

class Recipient(RecipientBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class RecipientWithCheckIns(Recipient):
    check_ins: List["CheckIn"] = []

class CheckInBase(BaseModel):
    status: CheckInStatus
    transcript: Optional[str] = None
    summary: Optional[str] = None
    audio_url: Optional[str] = None
    call_metadata: Optional[dict] = None

class CheckInCreate(CheckInBase):
    recipient_id: int

class CheckIn(CheckInBase):
    id: int
    recipient_id: int
    created_at: datetime
    completed_at: Optional[datetime] = None
    call_sid: Optional[str] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserBase 