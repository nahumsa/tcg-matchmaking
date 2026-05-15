# Swiss Matchmaking System

A full-stack Swiss-system tournament matchmaking app for organizers and players, with live updates and deterministic round management.

**This project is an attempt to use AI coding and learn from it.**

## Features

- **Tournament lifecycle management**: create, run, and complete tournaments with explicit state transitions.
- **Swiss round generation**: create next-round pairings with score-aware ordering and repeat-opponent avoidance.
- **Participant management**: join by room code, prevent duplicate names within a tournament, remove participants when needed.
- **Match reporting and scoring**: submit results with win/draw/loss point updates and automatic tournament completion checks.
- **Bye support**: auto-generated and auto-scored bye matches for odd player counts.
- **Live UI synchronization**: WebSocket event broadcasts for pairings and result updates.
- **Validation and integrity rules**: domain guards for immutable completed tournaments and safe round progression.

## Architectural Choices

### 1) Domain-oriented backend modules

The backend is organized by domain (`tournaments`, `participants`, `matches`) under `backend/app/api/`.
Each domain keeps a consistent internal shape:

- `models.py` for ORM entities
- `schemas.py` for API contracts
- `use_cases.py` for business rules
- `services.py` for orchestration and side effects
- `router.py` for HTTP route wiring

This keeps feature logic cohesive and reduces cross-module coupling.

### 2) Layered rule separation

The backend follows explicit layers:

- **Routers**: request/response handling and route validation.
- **Use cases**: core Swiss and tournament business logic.
- **Services**: coordination of repositories, use cases, and side effects.
- **Adapters/ports**: persistence contracts and SQLAlchemy implementations.

This design ensures business logic stays testable and is not tied directly to HTTP or database implementation details.

### 3) Ports and adapters for persistence boundaries

Repository contracts live in `backend/app/application/ports.py`, and SQLAlchemy-backed adapters live in `backend/app/adapters/sqlalchemy_repositories.py`.
This allows domain workflows to depend on interfaces rather than concrete storage details.

### 4) Real-time event architecture

Domain flows that change tournament state emit WebSocket events through service orchestration (`backend/app/core/manager.py`).
Clients can subscribe to live updates instead of polling, improving UX for active rounds.

### 5) Full-stack type-safe and testable frontend

Frontend uses React + TypeScript + Vite + TailwindCSS with component-level tests via Vitest + Testing Library.
TypeScript build checks and linting are part of CI and local pre-commit workflows.

## Tech Stack

- **Backend:** FastAPI, SQLAlchemy, Alembic, PostgreSQL, WebSockets, Pytest, Ruff
- **Frontend:** React, TypeScript, Vite, TailwindCSS, Vitest, Testing Library, ESLint
- **Tooling:** `uv`, pre-commit, GitHub Actions, Docker Compose

## Project Structure

```text
backend/app/
├── adapters/                       # SQLAlchemy repository implementations
├── application/
│   └── ports.py                    # Repository/service contracts
├── api/
│   ├── tournaments/                # Tournament domain
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── use_cases.py
│   │   ├── services.py
│   │   └── router.py
│   ├── participants/               # Participant domain
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── use_cases.py
│   │   ├── services.py
│   │   └── router.py
│   └── matches/                    # Match and Swiss pairing domain
│       ├── models.py
│       ├── schemas.py
│       ├── use_cases.py
│       ├── services.py
│       ├── pairing.py
│       └── router.py
├── core/
│   ├── config.py                   # Settings
│   ├── database.py                 # Engine/session/base
│   └── manager.py                  # WebSocket connection manager
└── main.py                         # FastAPI app entrypoint
```

## Getting Started

### Local development (recommended)

From project root:

```bash
make setup
make db-up
make backend-dev
make frontend-dev
```

### Backend (manual)

```bash
uv sync --project backend --dev
PYTHONPATH=. uv run --project backend uvicorn backend.app.main:app --reload
```

### Frontend (manual)

```bash
cd frontend
npm install
npm run dev
```

## Run with Docker

```bash
docker compose up -d
```

- Frontend: <http://localhost:8080>
- Backend API: <http://localhost:8000>
- Health: <http://localhost:8000/health>

## Quality and CI

PRs to `main` run backend and frontend pipelines:

- Backend lint + format check (Ruff)
- Backend tests + coverage
- Frontend lint (ESLint)
- Frontend type-check (`tsc -b`)
- Frontend tests + coverage

Coverage target is **80%** across changed areas.

## Testing and Linting

### Backend

```bash
uv run --project backend ruff check .
uv run --project backend ruff format --check .
PYTHONPATH=. uv run --project backend pytest backend/tests
```

### Frontend

```bash
cd frontend
npm run lint
npx tsc -b
npm test
```

### Pre-commit

From repo root:

```bash
uv run --project backend pre-commit run --all-files
```
