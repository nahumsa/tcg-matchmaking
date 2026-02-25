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

## Phase 2: Standings & Pairing Logic [checkpoint: d08ac3b]
- [x] Task: Backend - Standings Calculation Engine (2b64aa6)
    - [x] Create failing tests for Rank, Points, W/L/D, and OMW% calculations.
    - [x] Implement OMW% (Opponent Match Win percentage) logic.
    - [x] Create a service to aggregate standings for a tournament.
    - [x] Verify tests pass.
- [x] Task: Backend - Potential Pairings Logic (2b64aa6)
    - [x] Create failing test: Get potential opponents for a player.
    - [x] Implement logic to find unplayed opponents in similar score brackets.
    - [x] Add endpoint for a player to fetch their "potential pairings".
    - [x] Verify tests pass.
- [x] Task: Conductor - User Manual Verification 'Phase 2: Standings & Pairing Logic' (Protocol in workflow.md) (d08ac3b)

## Phase 3: Frontend Integration (Admin Dashboard)
- [x] Task: Frontend - Admin Participant List Component (cfeb07d)
    - [x] Create failing test: Component renders list of participants.
    - [x] Implement `ParticipantList` component for the Admin Dashboard.
    - [x] Connect component to Backend API (fetch, manual add, remove).
    - [x] Verify tests pass.
- [x] Task: Frontend - Error Handling for Duplicate Names (cfeb07d)
    - [x] Create failing test: Show error message when join fails due to duplicate name.
    - [x] Update `ParticipantJoin` component to handle 400 errors.
    - [x] Verify tests pass.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Frontend Integration (Admin Dashboard)' (Protocol in workflow.md)

## Phase 4: Frontend Integration (Player Standings)
- [ ] Task: Frontend - Player Standings & Pairings View
    - [ ] Create failing test: Display standings and potential pairings.
    - [ ] Implement `PlayerDashboard` or update `TournamentView` to show standings.
    - [ ] Connect to Backend API for standings and potential pairings.
    - [ ] Verify tests pass.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Frontend Integration (Player Standings)' (Protocol in workflow.md)
