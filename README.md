# CareCall

> **AI-powered wellness check-ins for your loved ones**

CareCall is an automated care system that helps caregivers stay connected with their loved ones through intelligent, AI-powered phone calls. Built for the **Solution Hacks 2024** hackathon, this project demonstrates the power of combining Twilio's communication platform with Google's Vertex AI Gemini for personalized care experiences.

## What is CareCall?

CareCall automatically makes phone calls to your loved ones, engaging them in natural conversations powered by AI. The system:

- **Makes personalized calls** using Google's Vertex AI Gemini to generate unique, caring scripts
- **Detects when calls aren't answered** and sends follow-up SMS messages
- **Tracks call outcomes** and provides detailed logs for caregivers
- **Offers immediate "Call Now" functionality** for urgent check-ins
- **Uses secure email authentication** with passwordless login

## Key Features

### AI-Powered Conversations
- **Personalized Scripts**: Each call is uniquely generated based on the recipient's health condition, current date, and caregiver information
- **Natural Voice**: Uses Twilio's text-to-speech with the "Alice" voice for warm, human-like conversations
- **Condition-Specific Care**: AI adapts conversations to address specific health conditions (diabetes, heart conditions, arthritis, depression, etc.)

### Smart Call Management
- **Instant Calling**: "Call Now" button for immediate check-ins
- **Call Status Tracking**: Monitors if calls are answered, duration, and outcomes
- **Automatic SMS**: Sends personalized concern messages when calls aren't answered
- **Detailed Logs**: Complete call history with transcripts and AI notes

### Secure Authentication
- **Passwordless Login**: Email-based verification with 4-digit codes
- **JWT Tokens**: Secure session management
- **Rate Limiting**: Protection against abuse

### Modern UI/UX
- **Beautiful Dashboard**: Clean, animated interface with real-time updates
- **Responsive Design**: Works on desktop and mobile
- **Dark/Light Mode**: Automatic theme switching
- **Real-time Updates**: Live call status and recipient management

## Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **AI/ML**: Google Cloud Vertex AI Gemini 2.5 Flash
- **Communication**: Twilio (Voice calls & SMS)
- **Authentication**: JWT with email verification via Resend
- **Deployment**: Google Cloud Run

### Frontend
- **Framework**: Next.js 14 with App Router
- **UI**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form with Zod validation
- **Deployment**: Vercel

### Infrastructure
- **Database**: PostgreSQL on Google Cloud SQL
- **Email**: Resend for verification emails
- **Tunneling**: ngrok for local development webhooks
- **CI/CD**: GitHub Actions for automated deployment

## Project Structure

```
CareCall/
├── backend/                 # FastAPI backend
│   ├── api/                # API routes
│   │   ├── checkins.py     # Call management & Twilio webhooks
│   │   ├── email_auth.py   # Authentication system
│   │   └── recipients.py   # Recipient CRUD operations
│   ├── models/             # Database models
│   ├── services/           # Business logic
│   │   └── call_pipeline.py # AI script generation & call orchestration
│   └── schemas/            # Pydantic schemas
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # React components
│   │   └── lib/          # Utilities
│   └── public/           # Static assets
└── migrations/           # Database migrations
```

## Important: Hackathon Development

**This repository is actively developed during Solution Hacks 2024 and may be messy due to rapid iteration and limited time for cleanup.**

### Current State:
- Core functionality working (calls, AI scripts, authentication)
- Basic UI/UX implemented
- Continuous refactoring and feature additions
- Some code may need cleanup post-hackathon
- Environment setup may require manual configuration

### Known Issues:
- Phone number format inconsistencies between Twilio and database
- ngrok URL changes require manual environment updates
- Some error handling could be more robust
- Database queries could be optimized

## Quick Start (Development)

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL
- ngrok (for webhook testing)
- Google Cloud account with Vertex AI enabled
- Twilio account
- Resend account

### 1. Clone & Setup
```bash
git clone https://github.com/wqschain/carecall.git
cd carecall
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Environment Configuration
Create `backend/.env`:
```env
DATABASE_URL=postgresql+asyncpg://username:password@localhost:5432/carecall
JWT_SECRET=your-super-secret-jwt-key
RESEND_API_KEY=re_your_resend_key
TWILIO_ACCOUNT_SID=ACyour_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
BASE_URL=https://your-ngrok-url.ngrok-free.app
GCP_PROJECT_ID=your-gcp-project-id
GCP_REGION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
```

### 4. Database Setup
```bash
# Create database
createdb carecall

# Run migrations
alembic upgrade head

# Start backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 6. ngrok Setup (for webhooks)
```bash
ngrok http 8000
# Update BASE_URL in backend/.env with new ngrok URL
```

## How It Works

### 1. User Authentication
- User enters email on login page
- System sends 4-digit verification code via Resend
- User enters code to authenticate
- JWT token stored in cookies for session management

### 2. Recipient Management
- Caregivers add recipients with name, phone number, and health condition
- Each recipient gets a personalized profile
- Dashboard shows all recipients with call status

### 3. AI Call Generation
- When "Call Now" is clicked, system triggers Twilio call
- Voice webhook receives call and looks up recipient by phone number
- Vertex AI Gemini generates personalized script based on:
  - Recipient's name and health condition
  - Current date and time
  - Caregiver's name
  - Condition-specific wellness tips

### 4. Call Processing
- Twilio plays AI-generated script using text-to-speech
- System tracks call status (answered, duration, etc.)
- If call isn't answered, sends personalized SMS via Twilio
- All call data logged for caregiver review

## API Endpoints

### Authentication
- `POST /api/auth/login/email` - Send verification code
- `POST /api/auth/verify` - Verify code and get token
- `GET /api/auth/me` - Get current user info

### Recipients
- `GET /api/recipients/` - List all recipients
- `POST /api/recipients/` - Create new recipient
- `PUT /api/recipients/{id}` - Update recipient
- `DELETE /api/recipients/{id}` - Delete recipient
- `POST /api/recipients/{id}/call-now` - Trigger immediate call

### Calls
- `GET /api/checkins` - Get call logs for recipient
- `POST /api/twilio/voice-webhook` - Handle incoming calls
- `POST /api/twilio/status-callback` - Handle call completion

## UI Components

### Dashboard
- **Animated Background**: Subtle node animations
- **Recipient Cards**: Status indicators, call buttons, edit/delete actions
- **Call Logs**: Expandable call history with transcripts
- **Real-time Updates**: Live status changes

### Forms
- **Recipient Form**: Add/edit recipient information
- **Login Form**: Email verification flow
- **Validation**: Zod schema validation with error messages

## Future Enhancements

### Planned Features
- **Scheduled Calls**: Automated daily/weekly check-ins
- **Voice Recognition**: Analyze recipient responses
- **Emergency Detection**: AI-powered concern detection
- **Multi-language Support**: Internationalization
- **Mobile App**: React Native companion app

### Technical Improvements
- **Redis Caching**: Improve performance
- **WebSocket Updates**: Real-time dashboard updates
- **Better Error Handling**: More robust error recovery
- **Testing**: Comprehensive test suite
- **Documentation**: API documentation with OpenAPI

## Contributing

This is a hackathon project, but contributions are welcome! Please note:

1. **Code Quality**: May be rough due to time constraints
2. **Documentation**: Incomplete due to rapid development
3. **Testing**: Limited test coverage
4. **Refactoring**: Ongoing cleanup needed

## Contact

- **Developer**: Waqas Rana
- **Twitter**: [@wqschain](https://x.com/wqschain)
- **GitHub**: [wqschain](https://github.com/wqschain)

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- **Solution Hacks 2024** for the hackathon platform
- **Google Cloud** for Vertex AI Gemini access
- **Twilio** for communication infrastructure
- **Vercel** for frontend hosting
- **shadcn/ui** for beautiful UI components

---

**Built with love for Solution Hacks 2024**

*CareCall - Making care personal, one call at a time.*

---

## Important Note

**This project is a hackathon submission and is not intended for production deployment by others.** While the code is functional and the setup instructions are provided for development purposes, deploying this to production requires significant additional work including:

- Proper security hardening
- Production-grade error handling
- Comprehensive testing
- Performance optimization
- Compliance considerations (HIPAA, etc.)
- Infrastructure scaling
- Monitoring and logging

The developer may deploy this to production independently after addressing these concerns. This repository serves as a demonstration of the concept and technical implementation rather than a production-ready application. 