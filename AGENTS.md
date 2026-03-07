# Agent Guide

## Purpose

This repository is a Swiss-system tournament matchmaking app with:

- Backend: FastAPI, SQLAlchemy, Alembic, PostgreSQL, WebSockets
- Frontend: React, TypeScript, Vite, TailwindCSS

Use this file as the default operating guide for code agents working in this repo.

## Source Material

The main project intent lives in `conductor/`.
Use these files first when you need product or workflow context:

- `conductor/product.md`
- `conductor/tech-stack.md`
- `conductor/workflow.md`
- `conductor/tracks.md`

## Architecture

### Backend structure

The backend is organized by domain under `backend/app/api/`:

- `tournaments/`
- `participants/`
- `matches/`

Each domain typically contains:

- `models.py`: SQLAlchemy ORM models
- `schemas.py`: Pydantic request/response schemas
- `use_cases.py`: core domain rules and decision logic
- `services.py`: orchestration and side effects
- `router.py`: FastAPI endpoints

### Backend layering rules

Follow the current layering, not a shortcut version.

1. Routers stay thin.
   - Validate route-level concerns.
   - Delegate to services.
   - Do not move business rules into routers.

2. Use cases contain business logic.
   - Swiss pairing rules, tournament lifecycle rules, reporting rules, participant constraints.
   - Prefer pure logic or logic expressed against repository ports.

3. Services orchestrate I/O.
   - Build repository objects.
   - Call use cases.
   - Handle websocket broadcasts and other side effects.

4. Ports and adapters separate domain logic from persistence.
   - Contracts live in `backend/app/application/ports.py`.
   - SQLAlchemy implementations live in `backend/app/adapters/sqlalchemy_repositories.py`.

5. Shared infrastructure lives in `backend/app/core/`.
   - `config.py`: settings
   - `database.py`: engine, session, base
   - `manager.py`: websocket connection manager

### Frontend structure

The frontend is a React + TypeScript app under `frontend/src/`.
Tests mostly live next to components as `*.test.tsx`.
Prefer keeping component logic tested through Vitest + Testing Library.

## Architectural expectations

- Preserve API compatibility unless the task explicitly changes an endpoint contract.
- Keep domain logic in backend use cases/services, not in the frontend.
- Reuse existing websocket event flow for live updates.
- If a change affects persistence, update SQLAlchemy models and Alembic migrations together.
- If a change affects architecture or workflow meaningfully, update the relevant `conductor/` docs too.

## Testing

### Full backend test suite

Run from repo root:

```bash
PYTHONPATH=. uv run --project backend pytest backend/tests
```

With coverage, matching CI:

```bash
PYTHONPATH=. uv run --project backend pytest backend/tests --cov=backend/app --cov-report=term-missing --cov-report=json:coverage-backend.json
```

### Full frontend test suite

Run from `frontend/`:

```bash
npm test
```

With coverage, matching CI:

```bash
npm run test -- --coverage --reporter=json --outputFile=coverage-frontend.json
```

### Targeted tests

Backend:

```bash
PYTHONPATH=. uv run --project backend pytest backend/tests/test_<name>.py
```

Frontend:

```bash
cd frontend && npm test -- <pattern>
```

### Important test caveat

Backend tests use a shared SQLite test database (`test.db`).
Do not run multiple backend pytest processes in parallel against the same worktree unless you first isolate the DB path, or you may get flaky `table already exists` / `no such table` failures.

## Linting and type checks

### Backend

```bash
uv run --project backend ruff check .
uv run --project backend ruff format --check .
```

### Frontend

```bash
cd frontend && npm run lint
cd frontend && npx tsc -b
```

## Pre-commit

This repo has a root `.pre-commit-config.yaml`.
Before committing, agents should run:

```bash
uv run --project backend pre-commit run --all-files
```

Current hooks include:

- trailing whitespace / EOF cleanup
- backend `ruff`
- backend `ruff-format`
- frontend ESLint
- frontend TypeScript build check
- backend tests
- frontend tests

Expect hooks to rewrite files when formatting is required. Re-stage those files before retrying the commit.

## CI expectations

GitHub Actions runs on PRs to `main`.
Match CI locally before considering work done:

Backend CI steps:

```bash
uv sync --project ./backend --dev
uv run --project ./backend ruff check .
uv run --project ./backend ruff format --check .
PYTHONPATH=. uv run --project ./backend pytest backend/tests --cov=backend/app --cov-report=term-missing --cov-report=json:coverage-backend.json
```

Frontend CI steps:

```bash
cd frontend
npm ci
npm run lint
npx tsc -b
npm run test -- --coverage --reporter=json --outputFile=coverage-frontend.json
```

Note:

- `conductor/workflow.md` and `README.md` describe an 80% coverage target.
- The current CI workflow comments against a 70% threshold but does not hard-fail on coverage percentage.
Aim for 80% on changed areas anyway.

## Database and migrations

Alembic config is rooted at the repo root:

- `alembic.ini`
- `alembic/`

Common commands:

```bash
uv run --project backend alembic -c alembic.ini upgrade head
uv run --project backend alembic -c alembic.ini revision --autogenerate -m "message"
```

Rules:

- If you change ORM schema, create or update an Alembic migration.
- Generate migrations from the repo root so `alembic.ini` is picked up.
- Validate migrations against a real database when possible.

## Daily development commands

From the repo root:

```bash
make setup
make db-up
make backend-dev
make frontend-dev
make test
make lint
```

Full stack with Docker:

```bash
docker compose up -d
```

## Coding guidance for agents

- Prefer focused changes inside the existing domain module.
- Add or update tests with every behavior change.
- Keep imports and formatting compatible with Ruff and the existing style.
- For frontend code, prefer named exports and maintain TypeScript correctness.
- Avoid inventing a new architectural pattern when the existing ports/adapters + domain module structure already fits.

## Done criteria for agent work

Before handing work back, an agent should usually have done all of the following:

- updated code in the correct architectural layer
- added or updated tests
- run the relevant targeted tests
- run the full backend suite if backend code changed
- run the frontend suite if frontend code changed
- run lint/type-check steps for the touched area
- run pre-commit before commit when preparing a commit
