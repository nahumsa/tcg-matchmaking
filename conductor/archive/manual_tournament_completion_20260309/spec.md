# Specification: Manual Tournament Completion & Standings Visibility

## Problem
Even though the tournament is over, the standings and export results are not showing on the admin page.
This happens when:
1.  The tournament status remains `ACTIVE` even though all matches have been played.
2.  The tournament should have ended early, but the system doesn't allow manual completion.
3.  The admin cannot see the standings table directly on the dashboard without clicking a separate link.

## Proposed Solution
1.  **Backend: Add an endpoint to manually complete a tournament.**
    - `POST /tournaments/{code}/complete`
    - Marks the tournament status as `COMPLETED`.
    - Broadcasts the update via WebSocket.
2.  **Frontend: Add a "Complete Tournament" button.**
    - Shown when all matches in the current round are completed.
    - Replaces the "Next Round" button if it's the last round.
3.  **Frontend: Improve Standings Visibility.**
    - Ensure standings and export options are visible even if `tournament.status` is not `COMPLETED` yet, but all matches are finished.
    - Or provide an easy way to see standings on the dashboard.

## Requirements
- Admin can manually end the tournament.
- Manual completion should trigger the "Tournament Completed" banner.
- "Next Round" button should change to "Complete Tournament" if no more rounds should be played.
- Handle edge cases where `tournament.rounds` was miscalculated.
