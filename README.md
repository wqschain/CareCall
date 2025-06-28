# CareCall

An AI-powered wellness check-in system developed during TheSolutionHacks 2024. The system automates regular wellness checks for caregivers and their loved ones through intelligent voice interactions and real-time monitoring.

## Project Overview

CareCall addresses the growing need for efficient remote care monitoring by leveraging artificial intelligence and automated communications. The system conducts regular check-ins via phone calls, analyzes responses for potential concerns, and provides immediate notifications to caregivers when attention is needed.

## Features

- Natural language processing for human-like conversations
- Automated scheduled check-in calls
- Real-time alert system for concerning responses
- Comprehensive wellness tracking dashboard
- Secure authentication and data protection
- Detailed analytics and reporting

## Tech Stack

### Frontend Architecture
- **Framework**: Next.js 14
- **Language**: TypeScript 5
- **State Management**: TanStack Query (React Query)
- **Form Handling**: React Hook Form with Zod validation
- **Styling**: 
  - TailwindCSS for utility-first CSS
  - shadcn/ui for component library
  - CSS Modules for component-specific styles
- **Authentication**: Auth0 integration
- **API Integration**: Axios with custom hooks
- **Build Tools**: 
  - Webpack (via Next.js)
  - PostCSS
  - ESLint & Prettier

### Backend Architecture
- **Framework**: FastAPI (Python 3.11)
- **Database**: 
  - SQLite with async support
  - SQLAlchemy ORM
  - Alembic for migrations
- **AI/ML Services**:
  - Google Cloud Vertex AI for conversation processing
  - OpenAI Whisper for speech-to-text
- **External Services**:
  - Twilio for telephony
  - SendGrid for email notifications
  - Google Cloud Text-to-Speech
- **Authentication**: JWT with Auth0
- **Testing**: pytest with async support

### DevOps
- **CI/CD**: GitHub Actions
- **Containerization**: Docker
- **Cloud Deployment**:
  - Backend: Google Cloud Run
  - Frontend: Vercel
- **Monitoring**: Google Cloud Operations

## Project Structure

```
CareCall/
├── backend/
│   ├── api/                    # API endpoints
│   ├── models/                 # Database models
│   ├── schemas/                # Pydantic schemas
│   ├── services/              # Business logic
│   │   └── call_pipeline.py   # Call handling
│   ├── tests/                 # Test suites
│   ├── Dockerfile
│   ├── main.py               # App entry
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js pages
│   │   ├── components/       # React components
│   │   ├── lib/             # Utilities
│   │   └── types/           # TypeScript types
│   ├── public/              # Static assets
│   └── package.json
├── .github/                  # CI/CD workflows
├── .gitignore
├── LICENSE
└── README.md
```

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Google Cloud account
- Twilio account
- Auth0 account
- SendGrid account

### Environment Variables

#### Backend (.env)
```
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_AUDIENCE=your-audience
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
SENDGRID_API_KEY=your-key
```

#### Frontend (.env.local)
```
AUTH0_SECRET=your-secret
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
API_BASE_URL=http://localhost:8000
```

### Installation

1. Clone the repository
```bash
git clone https://github.com/wqschain/carecall.git
cd carecall
```

2. Set up backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
```

3. Set up frontend
```bash
cd frontend
npm install
```

### Running the Application

1. Start the backend server
```bash
cd backend
uvicorn main:app --reload
```

2. Start the frontend development server
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Development

### Running Tests
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Code Style
```bash
# Backend
flake8

# Frontend
npm run lint
```

## Deployment

The application is set up for deployment to:
- Backend: Google Cloud Run
- Frontend: Vercel

Deployment is automated through GitHub Actions when pushing to the main branch.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Hackathon Context

This project was developed during TheSolutionHacks 2025. The goal was to demonstrate how AI and automation can be leveraged to solve real world problems.

## Contact

- Developer: Waqas Rana
- X (Twitter): [@wqschain](https://x.com/wqschain)
- Project Link: [https://github.com/wqschain/carecall](https://github.com/wqschain/carecall)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 