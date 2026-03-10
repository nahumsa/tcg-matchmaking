# Implementation Plan: Manual Tournament Conclusion & Standings Visibility

## Phase 1: Backend Manual Completion Endpoint

- [x] Task: Backend - Add Complete Endpoint
  - [x] Update `backend/app/api/tournaments/router.py` to add `POST /tournaments/{code}/complete`.
  - [x] Mark the tournament status as `COMPLETED`.
  - [x] Broadcast the update via WebSocket.
- [x] Task: Backend - Verification
  - [x] Create a test in `backend/tests/test_manual_completion.py`.

## Phase 2: Frontend Dashboard Integration

- [x] Task: Frontend - Add Complete Tournament Button
  - [x] Update `AdminDashboard.tsx` to handle the manual completion.
  - [x] Replace "Next Round" with "End Tournament" when `currentRound === tournament.rounds` and `allCompleted`.
- [x] Task: Frontend - Show Round Progress
  - [x] Update the UI to show "Round X of Y" to make it clear when the tournament is expected to end.
- [x] Task: Frontend - Refine UI Visibility
  - [x] Show the completion banner and "Export Results" if `allCompleted` even if not officially `COMPLETED`, OR ensure manual completion is intuitive.

## Phase 3: Validation & Cleanup

- [x] Task: Manual Verification
  - [x] Verify the end-to-end flow.
