from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from datetime import datetime, timedelta

from models.models import CheckIn, Recipient, User
from schemas.schemas import CheckIn as CheckInSchema
from .auth import get_current_user, get_db

router = APIRouter()

@router.get("/checkins", response_model=List[CheckInSchema])
async def get_checkins(
    recipient_id: int,
    days: int = 7,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get check-ins for a recipient within the specified number of days"""
    # Verify recipient belongs to current user
    query = select(Recipient).where(
        Recipient.id == recipient_id,
        Recipient.caregiver_id == current_user.id
    )
    result = await db.execute(query)
    recipient = result.scalar_one_or_none()
    
    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipient not found"
        )
    
    # Get check-ins
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    query = select(CheckIn).where(
        CheckIn.recipient_id == recipient_id,
        CheckIn.created_at >= cutoff_date
    ).order_by(CheckIn.created_at.desc())
    
    result = await db.execute(query)
    check_ins = result.scalars().all()
    return check_ins

@router.get("/checkins/{checkin_id}", response_model=CheckInSchema)
async def get_checkin(
    checkin_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific check-in"""
    # Join with Recipient to verify ownership
    query = select(CheckIn).join(Recipient).where(
        CheckIn.id == checkin_id,
        Recipient.caregiver_id == current_user.id
    )
    result = await db.execute(query)
    check_in = result.scalar_one_or_none()
    
    if not check_in:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Check-in not found"
        )
    return check_in

@router.post("/twilio/voice-webhook")
async def handle_voice_webhook(
    db: AsyncSession = Depends(get_db)
):
    """Handle incoming Twilio voice webhook"""
    # This will be implemented in the call pipeline service
    pass

@router.post("/twilio/recording-complete")
async def handle_recording_complete(
    db: AsyncSession = Depends(get_db)
):
    """Handle Twilio recording complete webhook"""
    # This will be implemented in the call pipeline service
    pass 