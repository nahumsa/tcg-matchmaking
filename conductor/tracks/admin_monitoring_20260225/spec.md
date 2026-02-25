# Specification: Admin Activity Monitoring & Tournament Conclusion

## Overview
This track focuses on enhancing the administrative experience by providing real-time activity monitoring (join logs) and formalizing the lifecycle of a tournament, ensuring clear visibility of standings at all times and a robust "completed" state.

## Functional Requirements

### 1. Real-time Activity Log
- The Admin Dashboard will feature a scrollable "Activity Log" section.
- It will display real-time events, specifically when a new player joins the tournament via room code.
- Events should be timestamped and updated via WebSockets.

### 2. Tournament Lifecycle Management
- **Completion Trigger:** When the last match of the final round (defined during tournament creation) is reported, the tournament state must transition to `COMPLETED`.
- **Data Freeze:** Once a tournament is `COMPLETED`:
    - No new players can join.
    - No existing match results can be modified.
    - No new pairings can be generated.

### 3. Conclusion User Experience
- **Status Banner:** A prominent "Tournament Completed" banner will appear on the Admin Dashboard.
- **Standings Shortcut:** The banner will provide a direct button/link to the final standings view.
- **Export Summary:** A feature to generate a text-based summary of the final standings (e.g., "1st: Player A, 2nd: Player B") for easy copying/sharing.

### 4. Global Standings Access
- A "Global Standings" link will be added to the primary Navigation Bar (visible to admins).
- This link provides quick access to the current standings of the active tournament from any administrative view.

## Acceptance Criteria
- [ ] Admin Dashboard displays a log of players joining in real-time.
- [ ] Tournament automatically transitions to `COMPLETED` after the final round is submitted.
- [ ] Joining and reporting are disabled for completed tournaments.
- [ ] A "Tournament Completed" banner is visible after the final round.
- [ ] Admin can generate a summary text of final results.
- [ ] Navigation bar includes a persistent link to tournament standings.

## Out of Scope
- Re-opening completed tournaments.
- Advanced log filtering or persistence across sessions (memory-only log for the current session is acceptable for MVP).
- CSV/PDF export (text-only summary for now).
