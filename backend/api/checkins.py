from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from datetime import datetime, timedelta
from twilio.twiml.voice_response import VoiceResponse
import os

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
async def handle_voice_webhook(request: Request):
    """Handle incoming Twilio voice call"""
    # Get call data from request
    form_data = await request.form()
    call_sid = form_data.get("CallSid")
    
    # Create TwiML response
    response = VoiceResponse()
    
    # Play the generated audio file
    # The audio file will be available at this URL because we'll serve the media directory
    response.play(f"{os.getenv('BASE_URL')}/media/script_{call_sid}.mp3")
    
    # After playing the message, record the response
    response.record(
        action=f"{os.getenv('BASE_URL')}/api/twilio/recording-complete",
        maxLength="120",  # 2 minutes max
        playBeep=True,
        trim="trim-silence"
    )
    
    return str(response)

@router.post("/twilio/recording-complete")
async def handle_recording_complete(request: Request):
    """Handle completed recording webhook"""
    # Import here to avoid circular imports
    from services.call_pipeline import handle_recording_webhook
    
    form_data = await request.form()
    recording_url = form_data.get("RecordingUrl")
    call_sid = form_data.get("CallSid")
    
    if recording_url and call_sid:
        await handle_recording_webhook(recording_url, call_sid)
    
    return {"status": "success"} 