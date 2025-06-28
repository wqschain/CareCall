# CareCall

CareCall is an automated check-in system that helps caregivers stay connected with their loved ones through regular, AI-powered phone calls.

## Features

- **Automated Check-ins**: Schedule regular phone calls to check on your loved ones
- **AI-Powered Conversations**: Natural conversations powered by Google's Vertex AI Gemini
- **Voice Processing**: High-quality speech-to-text transcription using Vertex AI
- **Email Authentication**: Secure, passwordless authentication using email verification
- **Emergency Alerts**: Immediate notifications when concerns are detected
- **Dashboard**: Easy management of recipients and check-in schedules

## Tech Stack

### Backend
- **Framework**: FastAPI
- **Database**: PostgreSQL with SQLAlchemy
- **Authentication**: JWT with email verification via Resend
- **AI/ML**: Google Cloud Vertex AI Gemini
- **Deployment**: Google Cloud Run

### Frontend
- **Framework**: Next.js 14
- **UI**: Tailwind CSS with shadcn/ui
- **State Management**: TanStack Query
- **Deployment**: Vercel

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL
- Resend account
- Google Cloud account

### Environment Variables

#### Backend (.env)
```
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/carecall
JWT_SECRET=your-jwt-secret-key
RESEND_API_KEY=your-resend-api-key
```

#### Frontend (.env)
```
BACKEND_URL=http://localhost:8000
JWT_SECRET=your-jwt-secret-key
RESEND_API_KEY=your-resend-api-key
```

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/carecall.git
cd carecall
```

2. Set up the backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload
```

3. Set up the frontend
```bash
cd frontend
npm install
npm run dev
```

## Development

### Database Migrations
```bash
cd backend
alembic revision -m "description_of_changes"
alembic upgrade head
```

### Running Tests
```bash
cd backend
pytest
```

## Deployment

The application is automatically deployed using GitHub Actions:
- Backend deploys to Google Cloud Run
- Frontend deploys to Vercel

Required secrets for deployment:
- `GCP_SA_KEY`: Google Cloud service account key
- `VERCEL_TOKEN`: Vercel deployment token
- `JWT_SECRET`: Secret key for JWT signing
- `RESEND_API_KEY`: API key from Resend
- `DATABASE_URL`: Production database URL

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 