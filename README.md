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

1. Install `uv` if you haven't already: [astral.sh/uv](https://astral.sh/uv)
2. Sync the project environment: `cd backend && uv sync`
3. Run the app: `PYTHONPATH=.. uv --project backend run uvicorn backend.app.main:app --reload`

### Frontend

1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`

## Running with Docker

The easiest way to run the entire stack (Backend, Frontend, and PostgreSQL) is using Docker Compose:

1. Ensure you have Docker and Docker Compose installed.
2. Run the following command from the project root:
   ```bash
   docker compose up -d
   ```
3. Access the application:
   - **Frontend:** [http://localhost:8080](http://localhost:8080)
   - **Backend API:** [http://localhost:8000](http://localhost:8000)
   - **Health Check:** [http://localhost:8000/health](http://localhost:8000/health)

## Testing

### Backend

Run tests with coverage:
```bash
PYTHONPATH=. uv --project backend run pytest --cov=backend/app backend/tests/
```

### Frontend

Run Vitest tests:
```bash
cd frontend
npm test
```
