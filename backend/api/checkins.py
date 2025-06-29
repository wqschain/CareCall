from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from datetime import datetime, timedelta
from twilio.twiml.voice_response import VoiceResponse
import os
from fastapi.responses import Response

from models.models import CheckIn, Recipient, User
from schemas.schemas import CheckIn as CheckInSchema
from .email_auth import get_current_user, get_db
from services.call_pipeline import get_checkin_by_call_sid, twilio_client, generate_concern_sms, generate_script
from models.enums import CheckInStatus
from models.base import SessionLocal

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
        Recipient.user_id == current_user.id
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
        Recipient.user_id == current_user.id
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
    try:
        print(f"=== VOICE WEBHOOK STARTED ===")
        # Get call data from request
        form_data = await request.form()
        call_sid = form_data.get("CallSid")
        to_number = form_data.get("To")
        
        print(f"Call SID: {call_sid}")
        print(f"To Number: {to_number}")
        
        # Get recipient and generate script
        recipient = None
        caregiver_name = None
        try:
            async with SessionLocal() as db:
                # Try to get recipient by phone number
                query = select(Recipient).where(Recipient.phone_number == to_number)
                result = await db.execute(query)
                recipient = result.scalar_one_or_none()
                
                if recipient:
                    print(f"Found recipient: {recipient.name}")
                    # Get caregiver name
                    query = select(User).where(User.id == recipient.user_id)
                    result = await db.execute(query)
                    user = result.scalar_one_or_none()
                    caregiver_name = user.name if user else None
                    print(f"Caregiver name: {caregiver_name}")
                else:
                    print(f"No recipient found for number: {to_number}")
        except Exception as e:
            print(f"Database error: {e}")
        
        # Generate script using Gemini (or fallback)
        script = None
        try:
            if recipient:
                script = await generate_script(recipient, caregiver_name)
                print(f"Generated script: {script[:100]}...")
            else:
                script = ("Hello! This is Nora from CareCall. "
                          "We hope you're doing well today. "
                          "If you need any assistance, please contact your caregiver. "
                          "Take care and have a wonderful day!")
                print("Using fallback script")
        except Exception as e:
            print(f"Script generation error: {e}")
            script = ("Hello! This is Nora from CareCall. "
                      "We hope you're doing well today. "
                      "If you need any assistance, please contact your caregiver. "
                      "Take care and have a wonderful day!")
        
        # Clean up script for Twilio TTS compatibility
        if script:
            # Remove any problematic characters that might cause Twilio TTS issues
            script = script.replace('"', '"').replace('"', '"')  # Smart quotes to regular quotes
            script = script.replace(''', "'").replace(''', "'")  # Smart apostrophes
            script = script.replace('–', '-').replace('—', '-')  # Em dashes to regular dashes
            script = script.replace('…', '...')  # Ellipsis
            script = script.replace('\n', ' ')  # Remove newlines
            script = script.replace('\r', ' ')  # Remove carriage returns
            script = ' '.join(script.split())  # Normalize whitespace
            print(f"Cleaned script: {script[:100]}...")
        
        # Create TwiML response
        response = VoiceResponse()
        
        # Play the generated script directly
        if script:
            response.say(script, voice='alice', language='en-US')
        else:
            response.say("Hello! This is Nora from CareCall. We hope you're doing well today. If you need any assistance, please contact your caregiver. Take care and have a wonderful day!", voice='alice', language='en-US')
        
        response.pause(length=2)  # Add a 2-second pause after the message
        
        twiml_response = str(response)
        print(f"Generated TwiML: {twiml_response}")
        print(f"=== VOICE WEBHOOK COMPLETED ===")
        
        return Response(content=str(response), media_type="text/xml")
        
    except Exception as e:
        print(f"Voice webhook error: {e}")
        import traceback
        traceback.print_exc()
        
        # Return a simple error response
        try:
            response = VoiceResponse()
            response.say("We're experiencing technical difficulties. Please try again later.", voice='alice', language='en-US')
            response.hangup()
            return Response(content=str(response), media_type="text/xml")
        except Exception as fallback_error:
            print(f"Fallback error response failed: {fallback_error}")
            # Return minimal valid TwiML
            minimal_response = '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Hello from CareCall. Please try again later.</Say></Response>'
            return Response(content=minimal_response, media_type="text/xml")

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

@router.post("/twilio/status-callback")
async def twilio_status_callback(request: Request):
    """Handle Twilio status callback for call completion and log 'NO_ANSWER' if needed, and send concern SMS."""
    form_data = await request.form()
    call_sid = form_data.get("CallSid")
    call_status = form_data.get("CallStatus")
    answered_by = form_data.get("AnsweredBy")
    call_duration = form_data.get("CallDuration")

    print(f"[Twilio Status Callback] SID: {call_sid}, Status: {call_status}, AnsweredBy: {answered_by}, Duration: {call_duration}")

    if not call_sid:
        print("No CallSid in status callback")
        return {"status": "ignored"}

    # Only process completed calls
    if call_status != "completed":
        print(f"Ignoring status: {call_status}")
        return {"status": "ignored"}

    check_in = await get_checkin_by_call_sid(call_sid)
    if not check_in:
        print(f"No check-in found for CallSid: {call_sid}")
        return {"status": "not_found"}

    # Determine if the call was answered by a human
    no_answer = False
    if answered_by not in ("human", "simulated-human"):
        no_answer = True
    try:
        duration = int(call_duration or 0)
        if duration < 5:
            no_answer = True
    except Exception:
        pass

    async with SessionLocal() as db:
        if no_answer:
            check_in.status = CheckInStatus.NO_ANSWER
            check_in.ai_notes = f"Call was not answered (AnsweredBy: {answered_by}, duration: {call_duration}s)"
            # Send concern SMS to recipient
            recipient = await db.get(Recipient, check_in.recipient_id)
            if recipient:
                # Generate personalized concern SMS using Gemini
                sms_body = await generate_concern_sms(recipient)
                try:
                    twilio_client.messages.create(
                        body=sms_body,
                        from_=os.getenv("TWILIO_PHONE_NUMBER"),
                        to=recipient.phone_number
                    )
                    print(f"Concern SMS sent to {recipient.phone_number}")
                except Exception as e:
                    print(f"Failed to send concern SMS: {e}")
        else:
            check_in.status = CheckInStatus.OK
            check_in.ai_notes = f"Call completed (AnsweredBy: {answered_by}, duration: {call_duration}s)"
        check_in.completed_at = datetime.utcnow()
        await db.commit()
        print(f"Updated check-in {check_in.id} with status {check_in.status}")
    return {"status": "logged"} 