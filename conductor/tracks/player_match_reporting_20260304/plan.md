# Plan: Player Match Reporting

**Track ID:** `player_match_reporting_20260304`

## Phase 1: Backend API for Match Reporting
- [x] Task: Create failing tests for the match reporting endpoint. (4f7ea1c)
- [x] Task: Implement `POST /tournaments/{code}/matches/{match_id}/report` endpoint in FastAPI. (4f7ea1c)
- [x] Task: Add permission checks to ensure only participants of the match (or admins) can report. (4f7ea1c)
- [x] Task: Update the tournament manager to recalculate standings and OMW% upon score submission. (4f7ea1c)
- [x] Task: Ensure the WebSocket manager broadcasts the updated match state to all clients. (4f7ea1c)

## Phase 2: Frontend UI for Match Reporting
- [x] Task: Create failing tests for the new reporting UI components. (2b7657f)
- [x] Task: Implement the "Report Score" button and preset selection modal in `TournamentView.tsx`. (2b7657f)
- [x] Task: Integrate the frontend with the new reporting API endpoint. (2b7657f)
- [x] Task: Update the WebSocket message handler to refresh match status and standings in real-time. (2b7657f)
- [x] Task: Add "Edit Score" capability for players if the round is still active. (2b7657f)

## Phase 3: Validation and Polishing
- [x] Task: Verify Admin Dashboard can override player-reported scores. (2b7657f)
- [x] Task: Perform E2E testing of the full "Join -> Play -> Report -> Standings" flow. (6031201)
- [x] Task: Create GitHub Pull Request with the complete implementation. (pending)
