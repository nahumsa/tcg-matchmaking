# Swiss Matchmaking System

A robust and accessible Swiss-system matchmaking platform for tournament organizers and participants.

**This project is an attempt to use AI Coding and learn from it.**

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
│   │   ├── use_cases.py
│   │   ├── services.py
│   │   └── router.py
│   ├── participants/   # Participant management domain
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── use_cases.py
│   │   ├── services.py
│   │   └── router.py
│   └── matches/        # Match and pairing domain
│       ├── models.py
│       ├── schemas.py
│       ├── use_cases.py
│       ├── services.py
│       ├── pairing.py  # Swiss pairing logic
│       └── router.py
├── core/               # Shared components
│   ├── config.py       # Configuration and settings
│   ├── database.py     # Database connection and base
│   └── manager.py      # WebSocket connection manager
└── main.py             # FastAPI application entry point
```

## Domain Use Cases

### Tournaments Domain (`api/tournaments`)

- Organizer creates a tournament by providing a name and number of rounds. The tournament use case generates a unique uppercase room code and persists the initial tournament state as `PENDING`.
- Organizer retrieves a tournament by room code to open the admin dashboard or validate that a player is joining the correct event.
- Tournament mutation guard prevents changes after completion. Any flow that affects roster, rounds, or results must pass the domain rule that a `COMPLETED` tournament is immutable.
- Room-code generation is centralized as a domain behavior, ensuring uniqueness checks always happen through the tournament repository instead of being duplicated in routers or service handlers.

### Participants Domain (`api/participants`)

- Player joins a tournament with a display name and room code. The participant join use case validates tournament mutability and rejects duplicate names within the same tournament.
- Organizer removes a participant before or during active rounds when corrections are needed. The use case enforces ownership (participant must belong to the target tournament) and completion constraints.
- Organizer and players list participants for lobby and round screens, relying on repository-backed reads scoped by tournament id.
- Potential pairing suggestions are computed per participant by excluding already played opponents and filtering to nearby score bands, helping manual corrections without violating Swiss pairing intent.

### Matches Domain (`api/matches`)

- Organizer generates next-round Swiss pairings. The use case validates preconditions (tournament not completed, participants exist, previous round completed) and determines the next round number.
- Pairings are sorted by combined points to improve table ordering quality, producing stable table assignments where higher-performing players are placed earlier.
- Bye handling is part of match generation: when an odd number of players exists, a bye match is created, auto-completed, and points are granted through the same domain flow.
- Score reporting updates match completion status and participant points (win/draw/loss logic), then checks final-round completion to automatically mark the tournament as `COMPLETED`.
- Match reporting and pairing generation emit websocket events through services so UI clients receive live updates while domain rules remain concentrated in use cases.

## Development Tools

### CI/CD Pipeline
The project uses GitHub Actions for continuous integration. Every Pull Request to `main` triggers:
- **Backend:** Linting (Ruff), Testing (Pytest), Coverage Report, and Docker build check.
- **Frontend:** Linting (ESLint), Type-checking (TSC), Testing (Vitest), Coverage Report, and Docker build check.
- **Coverage Summary:** A combined report is posted as a comment on the PR.

Threshold: **80% coverage** is the target for both modules.

### Pre-commit Hooks
To ensure code quality locally, the project includes `pre-commit` hooks.
1. Install pre-commit:
   ```bash
   cd backend && uv run pre-commit install
   ```
2. (Optional) Run against all files:
   ```bash
   cd backend && uv run pre-commit run --all-files
   ```
These hooks will automatically run backend/frontend linting, type-checking, and tests on every commit.

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
uv --project backend run pytest --cov=backend/app backend/tests/
```

### Frontend

Run Vitest tests:

```bash
cd frontend
npm test
```
