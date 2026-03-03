# Implementation Plan: Table Ordering by Points

## Phase 1: Backend Infrastructure and Models [checkpoint: f2f2ed0]

- [x] Task: Update Match model to include `table_number` field. [31d1a6d]
  - [ ] Add `table_number` to `backend/app/api/matches/models.py`.
  - [ ] Create and run Alembic migration for the new field.
- [x] Task: Update Match schemas for API response. [9af13f2]
  - [ ] Add `table_number` to `backend/app/api/matches/schemas.py`.

## Phase 2: Pairing Logic and Table Assignment

- [x] Task: Implement table assignment in the pairing engine. [abbd1cc]
  - [ ] Update `backend/app/api/matches/pairing.py` to sort matches by total points and tie-breakers.
  - [ ] Assign sequential `table_number` starting from 1 to sorted matches.
- [ ] Task: Write tests for point-based table ordering.
  - [ ] Create `backend/tests/test_table_ordering.py`.
  - [ ] Verify Table 1 contains top-ranked players with highest points.

## Phase 3: Frontend Display

- [ ] Task: Update Match components to display table numbers.
  - [ ] Update `frontend/src/components/TournamentView.tsx` to show `Table {match.table_number}`.
  - [ ] Update `frontend/src/components/AdminDashboard.tsx` if needed.
- [ ] Task: Add frontend tests for table number visibility.
  - [ ] Update `frontend/src/components/TournamentView.test.tsx`.

## Phase 4: Final Integration and Verification

- [ ] Task: End-to-End verification of table ordering in a live tournament flow.
  - [ ] Run a local tournament with mock players.
  - [ ] Verify Table 1 correctly reflects top pairings after multiple rounds.
