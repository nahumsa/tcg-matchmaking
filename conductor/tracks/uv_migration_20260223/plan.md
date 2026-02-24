# Implementation Plan: Migrate from pip to uv

## Overview
This plan outlines the steps to migrate the Python backend from `pip` and `requirements.txt` to `uv` and `pyproject.toml`.

## Phase 1: uv Initialization & Dependency Migration

- [x] **Task: Initialize uv project and create pyproject.toml. 14ddedf**
    - [x] Run `uv init --no-workspace` to create the initial `pyproject.toml`.
    - [x] Configure the project name and version in `pyproject.toml`.
- [x] **Task: Migrate dependencies from requirements.txt. 2112754**
    - [x] Extract main dependencies from `requirements.txt` and add them using `uv add`.
    - [x] Extract dev dependencies (`pytest`, `pytest-cov`, `httpx`) and add them to a `dev` group using `uv add --group dev`.
    - [x] Verify that `pyproject.toml` contains all necessary packages with correct version constraints (if any).
- [ ] **Task: Generate the uv.lock file.**
    - [ ] Run `uv lock` to ensure a reproducible dependency graph.
- [ ] **Task: Conductor - User Manual Verification 'uv Initialization & Dependency Migration' (Protocol in workflow.md)**

## Phase 2: Environment Transition & Verification

- [ ] **Task: Create and sync the uv-managed virtual environment.**
    - [ ] Run `uv venv` to create a new virtual environment.
    - [ ] Run `uv sync` to install all dependencies into the new environment.
- [ ] **Task: Verify backend functionality with uv.**
    - [ ] Run the backend automated test suite using `uv run pytest --cov=backend/app backend/tests/`.
    - [ ] Confirm that all 14 tests pass and coverage is maintained (approx. 85%).
- [ ] **Task: Verify server startup with uv.**
    - [ ] Run the FastAPI server using `uv run uvicorn backend.app.main:app --reload` and perform a basic health check.
- [ ] **Task: Conductor - User Manual Verification 'Environment Transition & Verification' (Protocol in workflow.md)**

## Phase 3: Cleanup & Documentation

- [ ] **Task: Remove old dependency artifacts.**
    - [ ] Delete the `requirements.txt` file.
    - [ ] Delete the old `venv/` directory (if separate from uv's `.venv`).
- [ ] **Task: Update README.md.**
    - [ ] Update "Getting Started" section to use `uv sync` and `uv run`.
    - [ ] Update "Testing" section to use `uv run pytest`.
- [ ] **Task: Update Dockerfile (if applicable).**
    - [ ] Update the `Dockerfile` to install `uv` and use it for building the image and installing dependencies.
- [ ] **Task: Conductor - User Manual Verification 'Cleanup & Finalization' (Protocol in workflow.md)**
