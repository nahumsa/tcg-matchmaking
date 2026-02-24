# Implementation Plan: MVC Backend Refactor

## Overview
This plan outlines the incremental refactor of the FastAPI backend into a domain-driven MVC architecture.

## Phase 1: Infrastructure & Tournament Domain [checkpoint: 92f458e]

- [x] **Task: Set up base infrastructure for domain-driven structure. fcc6481**
    - [x] Create `backend/app/api/` and `backend/app/core/` for shared components.
    - [x] Move `config.py` and `database.py` into `backend/app/core/`.
    - [x] Update imports across the backend to reflect the new infrastructure.
- [x] **Task: Migrate the Tournament domain. 29f3fdf**
    - [x] Create `backend/app/api/tournaments/` directory.
    - [x] Move tournament-related models to `backend/app/api/tournaments/models.py`.
    - [x] Extract tournament Pydantic schemas to `backend/app/api/tournaments/schemas.py`.
    - [x] Move tournament-related logic to `backend/app/api/tournaments/services.py`.
    - [x] Move tournament endpoints to `backend/app/api/tournaments/router.py`.
    - [x] Update `main.py` to include the tournament router.
    - [x] Write/update tests for the Tournament domain.
- [x] **Task: Conductor - User Manual Verification 'Infrastructure & Tournament Domain' (Protocol in workflow.md)**

## Phase 2: Participant & Match Domains

- [~] **Task: Migrate the Participant domain.**
    - [ ] Create `backend/app/api/participants/` directory.
    - [ ] Move participant-related models, schemas, and endpoints to their respective domain files.
    - [ ] Write/update tests for the Participant domain.
- [ ] **Task: Migrate the Match domain and Swiss Pairing.**
    - [ ] Create `backend/app/api/matches/` directory.
    - [ ] Move match models, schemas, and reporting endpoints to the Match domain.
    - [ ] Integrate `pairing.py` as a service within the Match domain.
    - [ ] Write/update tests for the Match domain and pairing logic.
- [ ] **Task: Conductor - User Manual Verification 'Participant & Match Domains' (Protocol in workflow.md)**

## Phase 3: Cleanup & Finalization

- [ ] **Task: Final backend structure cleanup.**
    - [ ] Remove old `models.py`, `utils.py`, and `pairing.py` from `backend/app/`.
    - [ ] Ensure all imports are optimized and relative where appropriate.
    - [ ] Run the full backend test suite to ensure 100% regression coverage.
- [ ] **Task: Update documentation and README.**
    - [ ] Update any internal developer documentation to reflect the new MVC/domain-driven structure.
- [ ] **Task: Conductor - User Manual Verification 'Cleanup & Finalization' (Protocol in workflow.md)**
