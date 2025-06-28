from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB

from .base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    recipients = relationship("Recipient", back_populates="user")

class Recipient(Base):
    __tablename__ = "recipients"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    phone_number = Column(String)
    condition = Column(String)
    preferred_time = Column(String)  # HH:MM in UTC
    emergency_contact_name = Column(String)
    emergency_contact_phone = Column(String)
    emergency_contact_email = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="recipients")
    check_ins = relationship("CheckIn", back_populates="recipient")

class CheckIn(Base):
    __tablename__ = "check_ins"

    id = Column(Integer, primary_key=True, index=True)
    recipient_id = Column(Integer, ForeignKey("recipients.id"))
    status = Column(String)  # OK, CONCERN, EMERGENCY, NO_ANSWER
    transcript = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    audio_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    call_metadata = Column(JSONB, nullable=True)

    # Relationships
    recipient = relationship("Recipient", back_populates="check_ins") 