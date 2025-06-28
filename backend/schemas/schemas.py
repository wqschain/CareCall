from datetime import datetime
from typing import Optional, List, Annotated
from pydantic import BaseModel, EmailStr, Field

from models.models import CheckInStatus

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    auth0_id: str

class User(UserBase):
    id: int
    auth0_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RecipientBase(BaseModel):
    name: str
    phone_number: Annotated[str, Field(pattern=r'^\+?1?\d{9,15}$')]
    condition: str
    preferred_time: str  # HH:MM in UTC
    emergency_contact_name: str
    emergency_contact_phone: Annotated[str, Field(pattern=r'^\+?1?\d{9,15}$')]

class RecipientCreate(RecipientBase):
    pass

class RecipientUpdate(RecipientBase):
    name: Optional[str] = None
    phone_number: Optional[Annotated[str, Field(pattern=r'^\+?1?\d{9,15}$')]] = None
    condition: Optional[str] = None
    preferred_time: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[Annotated[str, Field(pattern=r'^\+?1?\d{9,15}$')]] = None
    emergency_contact_email: Optional[EmailStr] = None

class Recipient(RecipientBase):
    id: int
    caregiver_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CheckInBase(BaseModel):
    recipient_id: int
    status: CheckInStatus

class CheckInCreate(CheckInBase):
    call_sid: str

class CheckInUpdate(BaseModel):
    status: Optional[CheckInStatus] = None
    recording_url: Optional[str] = None
    transcript: Optional[str] = None
    ai_notes: Optional[str] = None
    completed_at: Optional[datetime] = None

class CheckIn(CheckInBase):
    id: int
    call_sid: str
    recording_url: Optional[str] = None
    transcript: Optional[str] = None
    ai_notes: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class RecipientWithCheckIns(Recipient):
    check_ins: List[CheckIn]

    class Config:
        from_attributes = True 