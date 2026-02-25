# Implementation Plan: Player Management & Standings

## Phase 1: Backend Foundations (Uniqueness & Admin Actions) [checkpoint: 048e7b7]
- [x] Task: Backend - Implement Unique Name Constraint (c4d3e00)
    - [x] Create failing test: Join tournament with existing name.
    - [x] Update service to enforce name uniqueness per tournament.
    - [x] Implement error handling in the API router.
    - [x] Verify tests pass.
- [x] Task: Backend - Admin Manual Add Participant (c4d3e00)
    - [x] Create failing test: Admin adds a participant via API.
    - [x] Implement service method for manual participant addition.
    - [x] Add endpoint for admin manual add.
    - [x] Verify tests pass.
- [x] Task: Backend - Admin Remove Participant (c4d3e00)
    - [x] Create failing test: Admin removes a participant via API.
    - [x] Implement service method for participant removal.
    - [x] Add endpoint for participant deletion.
    - [x] Verify tests pass.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Backend Foundations' (Protocol in workflow.md) (048e7b7)

## Phase 2: Standings & Pairing Logic
- [ ] Task: Backend - Standings Calculation Engine
    - [ ] Create failing tests for Rank, Points, W/L/D, and OMW% calculations.
    - [ ] Implement OMW% (Opponent Match Win percentage) logic.
    - [ ] Create a service to aggregate standings for a tournament.
    - [ ] Verify tests pass.
- [ ] Task: Backend - Potential Pairings Logic
    - [ ] Create failing test: Get potential opponents for a player.
    - [ ] Implement logic to find unplayed opponents in similar score brackets.
    - [ ] Add endpoint for a player to fetch their "potential pairings".
    - [ ] Verify tests pass.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Standings & Pairing Logic' (Protocol in workflow.md)

## Phase 3: Frontend Integration (Admin Dashboard)
- [ ] Task: Frontend - Admin Participant List Component
    - [ ] Create failing test: Component renders list of participants.
    - [ ] Implement `ParticipantList` component for the Admin Dashboard.
    - [ ] Connect component to Backend API (fetch, manual add, remove).
    - [ ] Verify tests pass.
- [ ] Task: Frontend - Error Handling for Duplicate Names
    - [ ] Create failing test: Show error message when join fails due to duplicate name.
    - [ ] Update `ParticipantJoin` component to handle 400 errors.
    - [ ] Verify tests pass.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Frontend Integration (Admin Dashboard)' (Protocol in workflow.md)

## Phase 4: Frontend Integration (Player Standings)
- [ ] Task: Frontend - Player Standings & Pairings View
    - [ ] Create failing test: Display standings and potential pairings.
    - [ ] Implement `PlayerDashboard` or update `TournamentView` to show standings.
    - [ ] Connect to Backend API for standings and potential pairings.
    - [ ] Verify tests pass.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Frontend Integration (Player Standings)' (Protocol in workflow.md)
