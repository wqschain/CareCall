import os
from datetime import datetime
from twilio.rest import Client
from sqlalchemy.future import select

from models.models import Recipient, CheckIn
from models.enums import CheckInStatus
from models.base import SessionLocal

# Gemini imports
try:
    from vertexai.preview.generative_models import GenerativeModel
    import vertexai
    vertexai.init(project=os.getenv("GCP_PROJECT_ID"), location=os.getenv("GCP_REGION"))
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

# Initialize Twilio client
twilio_client = Client(os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN"))

async def get_checkin_by_call_sid(call_sid: str) -> CheckIn:
    """Get check-in record by call SID"""
    async with SessionLocal() as db:
        query = select(CheckIn).where(CheckIn.call_sid == call_sid)
        result = await db.execute(query)
        return result.scalar_one_or_none()

async def trigger_checkin(recipient_id: int) -> CheckIn:
    """Main function to trigger the check-in call pipeline"""
    async with SessionLocal() as db:
        # Get recipient
        query = select(Recipient).where(Recipient.id == recipient_id)
        result = await db.execute(query)
        recipient = result.scalar_one_or_none()
        
        if not recipient:
            raise ValueError("Recipient not found")

        # Create initial check-in record
        check_in = CheckIn(
            recipient_id=recipient_id,
            status=CheckInStatus.NO_ANSWER
        )
        db.add(check_in)
        await db.commit()
        await db.refresh(check_in)

        try:
            # Make call with Twilio (simple message only, no recording)
            call = twilio_client.calls.create(
                url=f"{os.getenv('BASE_URL')}/api/twilio/voice-webhook",
                to=recipient.phone_number,
                from_=os.getenv("TWILIO_PHONE_NUMBER")
            )

            # Update check-in with call SID
            check_in.call_sid = call.sid
            check_in.status = CheckInStatus.NO_ANSWER  # Temporary status, will be updated by status callback
            check_in.ai_notes = "Call initiated, waiting for completion"
            await db.commit()

        except Exception as e:
            # Log error and update status
            print(f"Error in check-in pipeline: {str(e)}")
            check_in.status = CheckInStatus.NO_ANSWER
            check_in.ai_notes = f"Error: {str(e)}"
            check_in.completed_at = datetime.utcnow()
            await db.commit()
            raise

        return check_in

async def generate_script(recipient: Recipient, caregiver_name: str = None) -> str:
    """Generate a wellness check-in script using Gemini, or fallback to a default message."""
    if GEMINI_AVAILABLE:
        try:
            # Get current date in a friendly format
            current_date = datetime.now().strftime("%A, %B %d")
            caregiver_ref = f"{caregiver_name}" if caregiver_name else "your caregiver"
            
            prompt = f"""You are Nora, a caring AI assistant from CareCall making a wellness check-in call to {recipient.name}.

CALL CONTEXT:
- Date: {current_date}
- Recipient: {recipient.name}
- Health Condition: {recipient.condition}
- Caregiver: {caregiver_ref}

TASK: Generate a natural, caring 6-7 sentence script for a phone call that:
1. Introduces yourself as "Nora from CareCall" and mentions today's date ({current_date})
2. Asks specifically about how their {recipient.condition} is affecting them today
3. Offers 1-2 condition-specific daily wellness tips or reminders
4. Inquires about any symptoms or challenges they're experiencing
5. Offers support and reminds them to contact {caregiver_ref} if needed
6. Ends with a warm goodbye message like "Take care and have a wonderful day!"

CONDITION-SPECIFIC ADVICE EXAMPLES:
- Diabetes: "Remember to check your blood sugar levels regularly today"
- Heart condition: "Try to take it easy and avoid strenuous activities"
- Arthritis: "Gentle stretching exercises might help with mobility today"
- Depression: "Getting some fresh air and sunlight could help boost your mood"
- General: "Staying hydrated and taking your medications as prescribed is important"

IMPORTANT:
- Always introduce yourself as "Nora from CareCall"
- Mention the current date naturally
- Be warm, empathetic, and conversational
- Provide relevant, actionable advice for their condition
- Keep it concise (6-7 sentences total)
- Sound natural when spoken aloud
- Use the caregiver's name when mentioning who to contact
- End with a warm, caring goodbye message

Generate the script:"""
            model = GenerativeModel("gemini-2.5-flash")
            response = await model.generate_content_async(prompt)
            script = response.text.strip()
            # Remove quotes if present (Gemini sometimes wraps responses in quotes)
            if script.startswith('"') and script.endswith('"'):
                script = script[1:-1]
            # Clean up any problematic characters for Twilio TTS
            script = script.replace('"', '"').replace('"', '"')  # Smart quotes to regular quotes
            script = script.replace(''', "'").replace(''', "'")  # Smart apostrophes
            script = script.replace('–', '-').replace('—', '-')  # Em dashes to regular dashes
            script = script.replace('…', '...')  # Ellipsis
            return script
        except Exception as e:
            print(f"Gemini error: {e}")
    # Fallback
    current_date = datetime.now().strftime("%A, %B %d")
    return (f"Hello! This is Nora from CareCall. Today is {current_date}. "
            "We hope you're doing well today. "
            "If you need any assistance, please contact your caregiver. "
            "Take care and have a wonderful day!")

async def generate_concern_sms(recipient: Recipient) -> str:
    """Generate a personalized concern SMS from Nora using Gemini."""
    if GEMINI_AVAILABLE:
        try:
            prompt = (
                f"You are Nora, a caring AI assistant from CareCall. "
                f"Write a short, warm SMS to {recipient.name} letting them know we missed them for their scheduled wellness check-in call. "
                f"Mention that if they need anything, they can reply to this message or contact their caregiver. "
                f"Sign off as Nora from CareCall."
            )
            model = GenerativeModel("gemini-2.5-flash")
            response = await model.generate_content_async(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"Gemini concern SMS error: {e}")
    # Fallback
    return (f"Hi {recipient.name}, this is Nora from CareCall. We missed you for your wellness check-in today. "
            "If you need anything, reply to this message or contact your caregiver. Take care! – Nora from CareCall")

# Recording-related functions removed - we're doing simple message-only calls 