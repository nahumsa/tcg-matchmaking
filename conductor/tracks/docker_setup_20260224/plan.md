# Implementation Plan: Docker Setup

## Overview
This plan outlines the steps to containerize the backend, frontend, and database using Docker and Docker Compose.

## Phase 1: Backend Dockerization

- [x] **Task: Create Backend Dockerfile. bc48a16**
    - [x] Create `backend/Dockerfile`.
    - [x] Use `python:3.12-slim` as base image.
    - [x] Install `uv`.
    - [x] Copy `pyproject.toml` and `uv.lock`.
    - [x] Install dependencies.
    - [x] Copy application code.
    - [x] Set `CMD` to run `uvicorn`.
- [x] **Task: Verify Backend Container. bc48a16**
    - [x] Build and run the backend image manually to ensure it starts.

## Phase 2: Frontend Dockerization

- [x] **Task: Create Frontend Dockerfile. 69a4723**
    - [x] Create `frontend/Dockerfile`.
    - [x] Use a multi-stage build: Node for building, Nginx for serving.
    - [x] Copy `package.json` and `package-lock.json`.
    - [x] Install dependencies.
    - [x] Build the Vite app.
    - [x] Configure Nginx to serve the build artifacts.
- [x] **Task: Verify Frontend Container. 69a4723**
    - [x] Build and run the frontend image manually.

## Phase 3: Orchestration with Docker Compose

- [x] **Task: Create docker-compose.yml. 29181bc**
    - [x] Define `db` service using `postgres:16-alpine`.
    - [x] Define `backend` service with build context `./backend`.
    - [x] Define `frontend` service with build context `./frontend`.
    - [x] Configure networking and environment variables.
    - [x] Set up volume for `db` data.
- [x] **Task: Verify Full Stack Orchestration. 29181bc**
    - [x] Run `docker-compose up`.
    - [x] Verify backend connects to `db`.
    - [x] Verify frontend can reach backend (may need CORS or proxy configuration).

## Phase 4: Documentation and Cleanup

- [ ] **Task: Update README.md with Docker instructions.**
    - [ ] Add instructions for running the app with Docker.
- [ ] **Task: Final Verification and Checkpoint.**
