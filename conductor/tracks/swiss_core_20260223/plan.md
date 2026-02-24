# Implementation Plan: Swiss Core System

## Overview
This plan outlines the steps for building the core Swiss tournament system, including tournament creation with random room codes, player joining, and a basic Swiss pairing engine.

## Phase 1: Core Backend & Data Model [checkpoint: 6514213]

- [x] **Task: Set up backend project structure and database connection. afacb6a**
    - [x] Initialize FastAPI project with dependencies (PostgreSQL, SQLAlchemy).
    - [x] Create a migration script to set up `tournaments`, `participants`, and `matches` tables.
    - [x] Write unit tests for database connection and basic CRUD operations.
- [x] **Task: Implement tournament creation with random room codes. 870ab3d**
    - [x] Define the `Tournament` model with fields for `id`, `name`, `code`, and `rounds`.
    - [x] Implement a function to generate a unique 6-character uppercase letter code.
    - [x] Create a POST endpoint for creating a tournament and saving it to the database.
    - [x] Write unit tests for tournament creation and code uniqueness.
- [x] **Task: Implement player joining via room code. 971df4a**
    - [x] Define the `Participant` model with fields for `id`, `tournament_id`, `name`, and `points`.
    - [x] Create a POST endpoint for participants to join an existing tournament by code.
    - [x] Write unit tests for participant registration and tournament membership validation.
- [x] **Task: Conductor - User Manual Verification 'Core Backend & Data Model' (Protocol in workflow.md)**

## Phase 2: Core Frontend & Tournament Creation

- [ ] **Task: Set up frontend project structure with TailwindCSS.**
    - [ ] Initialize React project and configure TailwindCSS for styling.
    - [ ] Implement basic routing for admin and participant views.
- [ ] **Task: Create admin dashboard for tournament creation.**
    - [ ] Build a form for administrators to create a tournament (name, round count).
    - [ ] Implement the API call to the backend and display the generated room code.
    - [ ] Write component tests for the tournament creation form.
- [ ] **Task: Create participant view for joining a tournament.**
    - [ ] Build a form for players to enter their name and the room code.
    - [ ] Implement the API call to join the tournament and display a success message.
    - [ ] Write component tests for the join tournament form.
- [ ] **Task: Conductor - User Manual Verification 'Core Frontend & Tournament Creation' (Protocol in workflow.md)**

## Phase 3: Swiss Pairing Engine & Results

- [ ] **Task: Implement the core Swiss pairing engine.**
    - [ ] Develop the logic for pairing participants based on their current points.
    - [ ] Implement checks to prevent repeat pairings within the same tournament.
    - [ ] Correctly handle byes for tournaments with an odd number of players.
    - [ ] Write comprehensive unit tests for the pairing engine with various scenarios.
- [ ] **Task: Implement match results reporting and standings update.**
    - [ ] Create API endpoints for reporting match scores.
    - [ ] Develop the logic for updating participant points and standings after each round.
    - [ ] Write unit tests for results reporting and standings calculation.
- [ ] **Task: Implement real-time updates via WebSockets.**
    - [ ] Set up a WebSocket endpoint in FastAPI to broadcast tournament updates.
    - [ ] Update the React frontend to listen for WebSocket messages and update pairings and standings in real-time.
    - [ ] Write tests for real-time data synchronization across clients.
- [ ] **Task: Conductor - User Manual Verification 'Swiss Pairing Engine & Results' (Protocol in workflow.md)**
