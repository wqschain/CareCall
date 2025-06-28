import os
from resend import Resend
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Resend with your API key
resend = Resend(api_key=os.getenv("RESEND_API_KEY"))

try:
    # Send a test email
    result = resend.emails.send({
        "from": "CareCall <noreply@carecall.club>",
        "to": "test@example.com",  # Replace with your email
        "subject": "Test Email from CareCall",
        "html": "<h1>Test Email</h1><p>If you receive this, Resend is configured correctly!</p>"
    })
    print("Email sent successfully!")
    print("Email ID:", result["id"])
except Exception as e:
    print("Error sending email:", str(e)) 