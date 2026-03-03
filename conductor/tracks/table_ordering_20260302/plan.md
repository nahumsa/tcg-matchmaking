# Implementation Plan: Table Ordering by Points

## Phase 1: Backend Infrastructure and Models
- [ ] Task: Update Match model to include `table_number` field.
    - [ ] Add `table_number` to `backend/app/api/matches/models.py`.
    - [ ] Create and run Alembic migration for the new field.
- [ ] Task: Update Match schemas for API response.
    - [ ] Add `table_number` to `backend/app/api/matches/schemas.py`.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Backend Infrastructure and Models' (Protocol in workflow.md)

## Phase 2: Pairing Logic and Table Assignment
- [ ] Task: Implement table assignment in the pairing engine.
    - [ ] Update `backend/app/api/matches/pairing.py` to sort matches by total points and tie-breakers.
    - [ ] Assign sequential `table_number` starting from 1 to sorted matches.
- [ ] Task: Write tests for point-based table ordering.
    - [ ] Create `backend/tests/test_table_ordering.py`.
    - [ ] Verify Table 1 contains top-ranked players with highest points.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Pairing Logic and Table Assignment' (Protocol in workflow.md)

## Phase 3: Frontend Display
- [ ] Task: Update Match components to display table numbers.
    - [ ] Update `frontend/src/components/TournamentView.tsx` to show `Table {match.table_number}`.
    - [ ] Update `frontend/src/components/AdminDashboard.tsx` if needed.
- [ ] Task: Add frontend tests for table number visibility.
    - [ ] Update `frontend/src/components/TournamentView.test.tsx`.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Frontend Display' (Protocol in workflow.md)

## Phase 4: Final Integration and Verification
- [ ] Task: End-to-End verification of table ordering in a live tournament flow.
    - [ ] Run a local tournament with mock players.
    - [ ] Verify Table 1 correctly reflects top pairings after multiple rounds.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Final Integration and Verification' (Protocol in workflow.md)
