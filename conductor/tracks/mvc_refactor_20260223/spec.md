# Track Specification: MVC Backend Refactor

## Overview
This track involves refactoring the existing FastAPI backend into a Model-View-Controller (MVC) architecture using a domain-driven structure. The goal is to improve maintainability and scalability by separating concerns and organizing code by feature.

## Functional Requirements
- **Domain-Driven Organization:** Reorganize `backend/app/` into domain-specific modules (e.g., `tournaments/`, `participants/`, `matches/`).
- **Component Separation:**
    - **Models:** Each domain module will have a `models.py` for SQLAlchemy definitions.
    - **Schemas:** Each domain module will have a `schemas.py` for Pydantic data validation.
    - **Services/Controllers:** Core business logic (like Swiss pairing) will be moved to `services.py` within each domain.
    - **Routers:** FastAPI endpoints will be organized into `router.py` files, delegating logic to services.
- **Incremental Migration:** The refactor will be performed feature-by-feature to ensure continuous stability and testing.

## Non-Functional Requirements
- **Improved Maintainability:** Logic is decoupled from routing, making unit testing easier.
- **Scalability:** The structure supports adding new domains and features without cluttering central files.
- **Backward Compatibility:** Existing API endpoints must maintain the same request/response signatures.

## Acceptance Criteria
- [ ] All existing backend tests pass after the refactor.
- [ ] Code is organized into domain-specific folders with clear model, schema, service, and router files.
- [ ] The Swiss pairing logic is successfully moved into a service and remains fully functional.
- [ ] The project structure follows the domain-driven pattern agreed upon.

## Out of Scope
- Adding new features to the backend during the refactor.
- Changing the database technology or migration tool (Alembic).
- Modifying the frontend application logic or styling.
