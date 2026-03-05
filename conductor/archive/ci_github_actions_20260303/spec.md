# Specification: GitHub Actions CI Pipeline

## Overview
Implement a comprehensive CI pipeline using GitHub Actions to automate linting, type-checking, unit/integration testing, and Docker image validation for both the backend and frontend.

## Functional Requirements
- **Triggers:** Automatically execute on Pull Requests targeting the `main` branch.
- **Backend (Python 3.12):**
  - **Linting & Formatting:** Run `ruff check` and `ruff format --check`.
  - **Unit & Integration Tests:** Run `pytest` with `pytest-cov`.
  - **Dependency Management:** Use `uv` for fast, reproducible dependency installation.
  - **Docker Validation:** Verify `backend/Dockerfile` builds successfully.
- **Frontend (Node.js):**
  - **Linting:** Run `npm run lint` (ESLint).
  - **Type-Checking:** Run `tsc` to ensure type safety.
  - **Unit Tests:** Run `npm run test` (Vitest).
  - **Docker Validation:** Verify `frontend/Dockerfile` builds successfully.
- **Coverage Reporting:**
  - Ensure backend and frontend code meets the >80% coverage requirement.
  - Post a summary of the test coverage as a comment on the Pull Request.
- **Failure Policy:** CI failures must strictly block Pull Requests from being merged.

## Non-Functional Requirements
- **Execution Environment:** Use containerized jobs or official GitHub Actions for environment isolation.
- **Performance:** Jobs should run in parallel (Backend vs Frontend) to minimize developer wait time.
- **Maintainability:** Use modular GitHub Action workflows (separate files if necessary).

## Acceptance Criteria
- [ ] CI pipeline triggers on PRs to `main`.
- [ ] PR merge is blocked if any check (lint, test, build) fails.
- [ ] Coverage reports are automatically posted to PR comments.
- [ ] Backend and frontend Docker images build without errors in the CI environment.

## Out of Scope
- Automated deployment (CD) to any environment.
- End-to-End browser testing (e.g., Playwright/Cypress).
- Security scanning (SAST/DAST) - to be addressed in a future track.
