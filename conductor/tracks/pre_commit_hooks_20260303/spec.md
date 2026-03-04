# Specification: Pre-commit Hooks

## Overview
Implement a comprehensive `pre-commit` configuration to automate local quality checks, ensuring that code matches the CI/CD pipeline's standards before being committed.

## Functional Requirements
- **Backend (Python):**
  - Run `ruff check` on staged files.
  - Run `ruff format` on staged files.
  - (Optional but requested) Run a subset of `pytest` or ensure all tests pass.
- **Frontend (Node.js/React):**
  - Run `eslint` on staged files.
  - Run `tsc -b` to verify type safety.
  - (Optional but requested) Run `vitest` tests.
- **General:**
  - Standard hooks: `trailing-whitespace`, `end-of-file-fixer`, `check-yaml`, `check-added-large-files`.
- **Installation:**
  - Provide a way to easily install the hooks for new developers.

## Acceptance Criteria
- [ ] `.pre-commit-config.yaml` is correctly configured and working.
- [ ] Pre-commit hooks run automatically on `git commit`.
- [ ] Backend and frontend linting/formatting checks are included.
- [ ] Type-checking for the frontend is included.
- [ ] (Requested) Backend and frontend tests are included (either in `pre-commit` or as a recommended manual check).
