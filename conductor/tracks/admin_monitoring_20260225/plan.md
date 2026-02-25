# Implementation Plan: Admin Activity Monitoring & Tournament Conclusion

## Phase 1: Backend Lifecycle & State Management
- [ ] Task: Backend - Update Tournament Model
    - [ ] Add `status` field to `Tournament` model (Enum: `ACTIVE`, `COMPLETED`).
    - [ ] Create and run Alembic migration.
- [ ] Task: Backend - Implementation of Completion Logic
    - [ ] Update match reporting service to check if the last match of the final round is being submitted.
    - [ ] Automatically set tournament status to `COMPLETED` when criteria are met.
- [ ] Task: Backend - Data Freeze Enforcement
    - [ ] Update "Join", "Report Match", and "Generate Pairings" endpoints to block requests if the tournament is `COMPLETED`.
    - [ ] Verify with unit tests.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Backend Lifecycle' (Protocol in workflow.md)

## Phase 2: Activity Feed & Standings Access
- [ ] Task: Backend - Enhanced Join Notification
    - [ ] Update join service to broadcast a richer "participant_joined" event including a timestamp.
- [ ] Task: Frontend - Admin Activity Log Component
    - [ ] Implement `ActivityLog` component to display a scrollable list of events from WebSockets.
    - [ ] Integrate component into the Admin Dashboard.
- [ ] Task: Frontend - Global Navigation Update
    - [ ] Add "Standings" link to the Navigation Bar.
    - [ ] Ensure it links to the current tournament's standings page.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Activity Feed & Standings' (Protocol in workflow.md)

## Phase 3: Conclusion UI & Export
- [ ] Task: Frontend - Completion UI
    - [ ] Implement the "Tournament Completed" banner.
    - [ ] Update dashboard buttons (Pairing, Reporting) to be disabled/hidden if status is `COMPLETED`.
- [ ] Task: Frontend - Export Summary
    - [ ] Add "Export Results" button to the completed state banner.
    - [ ] Implement logic to generate a formatted text summary of standings.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Conclusion UI' (Protocol in workflow.md)
