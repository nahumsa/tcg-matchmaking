# Plan: Player Match Reporting

**Track ID:** `player_match_reporting_20260304`

## Phase 1: Backend API for Match Reporting
- [ ] Task: Create failing tests for the match reporting endpoint.
- [ ] Task: Implement `POST /tournaments/{code}/matches/{match_id}/report` endpoint in FastAPI.
- [ ] Task: Add permission checks to ensure only participants of the match (or admins) can report.
- [ ] Task: Update the tournament manager to recalculate standings and OMW% upon score submission.
- [ ] Task: Ensure the WebSocket manager broadcasts the updated match state to all clients.

## Phase 2: Frontend UI for Match Reporting
- [ ] Task: Create failing tests for the new reporting UI components.
- [ ] Task: Implement the "Report Score" button and preset selection modal in `TournamentView.tsx`.
- [ ] Task: Integrate the frontend with the new reporting API endpoint.
- [ ] Task: Update the WebSocket message handler to refresh match status and standings in real-time.
- [ ] Task: Add "Edit Score" capability for players if the round is still active.

## Phase 3: Validation and Polishing
- [ ] Task: Verify Admin Dashboard can override player-reported scores.
- [ ] Task: Perform E2E testing of the full "Join -> Play -> Report -> Standings" flow.
- [ ] Task: Create GitHub Pull Request with the complete implementation.
