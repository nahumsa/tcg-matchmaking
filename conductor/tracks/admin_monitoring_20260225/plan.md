# Implementation Plan: Admin Activity Monitoring & Tournament Conclusion

## Phase 1: Backend Lifecycle & State Management [checkpoint: 7255772]

- [x] Task: Backend - Update Tournament Model (25b31d0)
  - [x] Add `status` field to `Tournament` model (Enum: `ACTIVE`, `COMPLETED`).
  - [x] Create and run Alembic migration.
- [x] Task: Backend - Implementation of Completion Logic (25b31d0)
  - [x] Update match reporting service to check if the last match of the final round is being submitted.
  - [x] Automatically set tournament status to `COMPLETED` when criteria are met.
- [x] Task: Backend - Data Freeze Enforcement (25b31d0)
  - [x] Update "Join", "Report Match", and "Generate Pairings" endpoints to block requests if the tournament is `COMPLETED`.
  - [x] Verify with unit tests.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Backend Lifecycle' (Protocol in workflow.md) (7255772)

## Phase 2: Activity Feed & Standings Access

- [~] Task: Backend - Enhanced Join Notification
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
