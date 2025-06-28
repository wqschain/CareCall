import os
from datetime import datetime
import vertexai
from vertexai.language_models import TextGenerationModel
from google.cloud import texttospeech, storage
from twilio.rest import Client
import openai
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import asyncio
import json
from sqlalchemy.future import select

from models.models import Recipient, CheckIn, CheckInStatus
from models.base import SessionLocal

# Initialize clients
vertexai.init(project=os.getenv("GCP_PROJECT_ID"), location=os.getenv("GCP_REGION"))
tts_client = texttospeech.TextToSpeechClient()
twilio_client = Client(os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN"))
sendgrid_client = SendGridAPIClient(os.getenv("SENDGRID_API_KEY"))
openai.api_key = os.getenv("OPENAI_API_KEY")

async def generate_script(recipient: Recipient) -> str:
    """Generate conversation script using Vertex AI Gemini"""
    prompt = f"""Generate a natural, caring conversation script for a wellness check-in call.
    The recipient is {recipient.name}, who has {recipient.condition}.
    The script should:
    1. Introduce the AI as a care assistant
    2. Ask how they're feeling today
    3. Ask about their condition
    4. Ask if they need any help
    Keep the tone warm and conversational."""

    model = TextGenerationModel.from_pretrained("text-bison@001")
    response = model.predict(prompt).text
    return response

async def text_to_speech(text: str, output_path: str):
    """Convert script to speech using Google Cloud TTS"""
    synthesis_input = texttospeech.SynthesisInput(text=text)
    voice = texttospeech.VoiceSelectionParams(
        language_code="en-US",
        name="en-US-Wavenet-D",
        ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
    )
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3
    )

    response = tts_client.synthesize_speech(
        input=synthesis_input,
        voice=voice,
        audio_config=audio_config
    )

    with open(output_path, "wb") as out:
        out.write(response.audio_content)

async def transcribe_audio(audio_url: str) -> str:
    """Transcribe audio using OpenAI Whisper"""
    audio_response = await asyncio.to_thread(
        openai.Audio.transcribe,
        "whisper-1",
        audio_url
    )
    return audio_response["text"]

async def analyze_response(transcript: str, recipient: Recipient) -> tuple[CheckInStatus, str]:
    """Analyze response using Vertex AI Gemini"""
    prompt = f"""Analyze this wellness check-in response for {recipient.name} who has {recipient.condition}.
    Transcript: "{transcript}"
    
    Classify the response into one of these categories:
    - OK: Person seems well
    - CONCERN: Some issues that need attention
    - EMERGENCY: Immediate help needed
    
    Also generate a brief note about the interaction.
    
    Return response as JSON:
    {{
        "status": "OK|CONCERN|EMERGENCY",
        "notes": "Brief analysis"
    }}"""

    model = TextGenerationModel.from_pretrained("text-bison@001")
    response = json.loads(model.predict(prompt).text)
    return CheckInStatus[response["status"]], response["notes"]

async def notify_contacts(recipient: Recipient, status: CheckInStatus, notes: str):
    """Send notifications based on check-in status"""
    if status in [CheckInStatus.CONCERN, CheckInStatus.EMERGENCY]:
        # Send SMS via Twilio
        message = twilio_client.messages.create(
            body=f"Alert for {recipient.name}: {status.value}\n{notes}",
            from_=os.getenv("TWILIO_PHONE_NUMBER"),
            to=recipient.emergency_contact_phone
        )

        # Send email via SendGrid
        email = Mail(
            from_email="alerts@carecall.com",
            to_emails=recipient.emergency_contact_email,
            subject=f"CareCall Alert for {recipient.name}",
            html_content=f"""
            <h2>Alert: {status.value}</h2>
            <p><strong>Recipient:</strong> {recipient.name}</p>
            <p><strong>Condition:</strong> {recipient.condition}</p>
            <p><strong>Notes:</strong> {notes}</p>
            <p><strong>Time:</strong> {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
            """
        )
        await asyncio.to_thread(sendgrid_client.send, email)

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
            # Generate and synthesize script
            script = await generate_script(recipient)
            audio_path = f"media/script_{check_in.id}.mp3"
            await text_to_speech(script, audio_path)

            # Make call with Twilio
            call = twilio_client.calls.create(
                url=f"{os.getenv('BASE_URL')}/api/twilio/voice-webhook",
                to=recipient.phone_number,
                from_=os.getenv("TWILIO_PHONE_NUMBER"),
                record=True,
                status_callback=f"{os.getenv('BASE_URL')}/api/twilio/recording-complete",
                status_callback_event=['completed']
            )

            # Update check-in with call SID
            check_in.call_sid = call.sid
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

async def handle_recording_webhook(recording_url: str, call_sid: str):
    """Handle the recording webhook from Twilio"""
    async with SessionLocal() as db:
        # Get check-in by call SID
        query = select(CheckIn).where(CheckIn.call_sid == call_sid)
        result = await db.execute(query)
        check_in = result.scalar_one_or_none()
        
        if not check_in:
            raise ValueError("Check-in not found")

        try:
            # Get recipient
            query = select(Recipient).where(Recipient.id == check_in.recipient_id)
            result = await db.execute(query)
            recipient = result.scalar_one_or_none()

            # Process recording
            transcript = await transcribe_audio(recording_url)
            status, notes = await analyze_response(transcript, recipient)

            # Update check-in
            check_in.status = status
            check_in.recording_url = recording_url
            check_in.transcript = transcript
            check_in.ai_notes = notes
            check_in.completed_at = datetime.utcnow()
            await db.commit()

            # Send notifications if needed
            await notify_contacts(recipient, status, notes)

        except Exception as e:
            print(f"Error processing recording: {str(e)}")
            check_in.status = CheckInStatus.NO_ANSWER
            check_in.ai_notes = f"Error processing recording: {str(e)}"
            check_in.completed_at = datetime.utcnow()
            await db.commit()
            raise 