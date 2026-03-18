# Implementation Plan: Show Match Scores on Admin Page

## Objective
Show each match’s score on the admin dashboard match cards, centered between players, and only once the match is completed.

## Key Files & Changes
- `frontend/src/components/AdminDashboard.tsx`
  - Add a centered score badge in the match card (non-bye matches only).
  - Render the score only when `match.is_completed` is truthy.
  - Keep Report/Override button placement intact.
- `frontend/src/components/AdminDashboard.test.tsx`
  - Add tests to verify scores render for completed matches and do not render for incomplete matches.

## Implementation Steps
1. **UI Update**: Add a score badge in the center column between players for non-bye matches.
2. **Conditional Display**: Show the badge only when the match is completed.
3. **Tests**: Add/adjust tests for completed vs incomplete score visibility.

## Validation Plan
- `cd frontend && npm test -- AdminDashboard.test.tsx`
- `cd frontend && npm run lint`
