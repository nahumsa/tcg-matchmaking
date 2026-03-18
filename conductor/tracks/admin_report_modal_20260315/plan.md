# Implementation Plan: Reuse Player Report Modal in Admin

## Objective
Use the same score-reporting modal on the admin page that players use for reporting matches, keeping the UI consistent and the code DRY.

## Key Files & Changes
- `frontend/src/components/ReportMatchModal.tsx`
  - Extract the report modal UI into a shared component.
- `frontend/src/components/TournamentView.tsx`
  - Replace inline modal JSX with the shared `ReportMatchModal` component.
- `frontend/src/components/AdminDashboard.tsx`
  - Replace inline score inputs with the shared modal and preset-based reporting.
  - Keep admin report submission using `is_admin: true`.
- `frontend/src/components/AdminDashboard.test.tsx`
  - Add a test to ensure the modal opens and submits the admin report request.

## Implementation Steps
1. **Shared Modal**: Create `ReportMatchModal` and move the UI from `TournamentView`.
2. **Player Usage**: Wire `TournamentView` to use `ReportMatchModal` with existing state and handlers.
3. **Admin Usage**: Replace admin inline inputs with modal open/submit flow using preset scores.
4. **Tests**: Add coverage for admin modal open and report submission.

## Validation Plan
- `cd frontend && npm test -- AdminDashboard.test.tsx TournamentView.test.tsx`
- `cd frontend && npm run lint`
