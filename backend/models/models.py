from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
import enum

from .base import Base

class CheckInStatus(enum.Enum):
    OK = "OK"
    CONCERN = "CONCERN"
    EMERGENCY = "EMERGENCY"
    NO_ANSWER = "NO_ANSWER"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    auth0_id = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    recipients = relationship("Recipient", back_populates="caregiver")

class Recipient(Base):
    __tablename__ = "recipients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    phone_number = Column(String)
    condition = Column(String)
    preferred_time = Column(String)  # Store as HH:MM in UTC
    emergency_contact_name = Column(String)
    emergency_contact_phone = Column(String)
    caregiver_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    caregiver = relationship("User", back_populates="recipients")
    check_ins = relationship("CheckIn", back_populates="recipient")

class CheckIn(Base):
    __tablename__ = "check_ins"

    id = Column(Integer, primary_key=True, index=True)
    recipient_id = Column(Integer, ForeignKey("recipients.id"))
    status = Column(Enum(CheckInStatus))
    call_sid = Column(String)  # Twilio Call SID
    recording_url = Column(String, nullable=True)
    transcript = Column(Text, nullable=True)
    ai_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    recipient = relationship("Recipient", back_populates="check_ins") 