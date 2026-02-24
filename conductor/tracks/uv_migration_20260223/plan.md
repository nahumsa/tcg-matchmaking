# Implementation Plan: Migrate from pip to uv

## Overview
This plan outlines the steps to migrate the Python backend from `pip` and `requirements.txt` to `uv` and `pyproject.toml`.

## Phase 1: uv Initialization & Dependency Migration [checkpoint: ea6c56a]

- [x] **Task: Initialize uv project and create pyproject.toml. 14ddedf**
    - [x] Run `uv init --no-workspace` to create the initial `pyproject.toml` in `backend/`.
    - [x] Configure the project name and version in `pyproject.toml`.
- [x] **Task: Migrate dependencies from requirements.txt. 2112754**
    - [x] Extract main dependencies from `requirements.txt` and add them using `uv add`.
    - [x] Extract dev dependencies (`pytest`, `pytest-cov`, `httpx`, `ruff`) and add them to a `dev` group using `uv add --group dev`.
    - [x] Verify that `pyproject.toml` contains all necessary packages with correct version constraints (if any).
- [x] **Task: Generate the uv.lock file. 2112754**
    - [x] Run `uv lock` to ensure a reproducible dependency graph in `backend/`.
- [x] **Task: Conductor - User Manual Verification 'uv Initialization & Dependency Migration' (Protocol in workflow.md)**

## Phase 2: Environment Transition & Verification [checkpoint: 0d51822]

- [x] **Task: Create and sync the uv-managed virtual environment. ea6c56a**
    - [x] Run `uv venv` in `backend/` to create a new virtual environment.
    - [x] Run `uv sync` in `backend/` to install all dependencies into the new environment.
- [x] **Task: Verify backend functionality with uv. ea6c56a**
    - [x] Run the backend automated test suite using `cd backend && uv run pytest --cov=app ../tests/`.
    - [x] Confirm that all 14 tests pass and coverage is maintained (approx. 85%).
- [x] **Task: Verify server startup with uv. ea6c56a**
    - [x] Run the FastAPI server using `cd backend && uv run uvicorn app.main:app --reload` and perform a basic health check.
- [x] **Task: Conductor - User Manual Verification 'Environment Transition & Verification' (Protocol in workflow.md)**

## Phase 3: Cleanup & Documentation

- [x] **Task: Remove old dependency artifacts. 0e4fffa**
    - [x] Delete the `requirements.txt` file.
    - [x] Delete the old `venv/` directory (if separate from uv's `.venv`).
- [x] **Task: Update README.md. f13baa8**
    - [x] Update "Getting Started" section to use `cd backend && uv sync` and `uv run`.
    - [x] Update "Testing" section to use `uv run pytest`.
- [x] **Task: Update Dockerfile (if applicable). f13baa8**
    - [x] Update the `Dockerfile` to install `uv` and use it for building the image and installing dependencies.
- [ ] **Task: Conductor - User Manual Verification 'Cleanup & Finalization' (Protocol in workflow.md)**
