# Swiss Matchmaking System

A robust and accessible Swiss-system matchmaking platform for tournament organizers and participants.

## Tech Stack

- **Backend:** Python (FastAPI), PostgreSQL, SQLAlchemy, Alembic, WebSockets.
- **Frontend:** React, TypeScript, TailwindCSS, React Router.

## Project Structure

The backend follows a domain-driven MVC (Model-View-Controller) architecture:

```
backend/app/
├── api/                # Domain-specific modules
│   ├── tournaments/    # Tournament management domain
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── services.py
│   │   └── router.py
│   ├── participants/   # Participant management domain
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── services.py
│   │   └── router.py
│   └── matches/        # Match and pairing domain
│       ├── models.py
│       ├── schemas.py
│       ├── services.py
│       ├── pairing.py  # Swiss pairing logic
│       └── router.py
├── core/               # Shared components
│   ├── config.py       # Configuration and settings
│   ├── database.py     # Database connection and base
│   └── manager.py      # WebSocket connection manager
└── main.py             # FastAPI application entry point
```

## Getting Started

### Backend

1. Create a virtual environment: `python -m venv venv`
2. Activate it: `source venv/bin/activate`
3. Install dependencies: `pip install -r requirements.txt`
4. Run the app: `uvicorn backend.app.main:app --reload`

### Frontend

1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`

## Testing

### Backend

Run tests with coverage:
```bash
source venv/bin/activate
export PYTHONPATH=$PYTHONPATH:.
pytest --cov=backend/app backend/tests/
```

### Frontend

Run Vitest tests:
```bash
cd frontend
npm test
```
