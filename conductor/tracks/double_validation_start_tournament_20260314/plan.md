# Implementation Plan: Double Validation to Start Tournament

## Objective
Add a two-step confirmation flow before generating the first round pairings, ensuring admins must explicitly confirm and type the tournament code before starting a tournament.

## Key Files & Changes
- `frontend/src/components/AdminDashboard.tsx`
  - Add state for start modal steps, confirmation input, and errors.
  - Replace the initial Start Round action with a two-step modal (warning then code entry) before calling the existing `/tournaments/{code}/pairings` endpoint.
  - Keep subsequent round generation unchanged; only the first start is gated by the modal.
- `frontend/src/i18n.tsx`
  - Add English and Portuguese strings for the new confirmation flow (titles, body text, buttons, code prompt, mismatch error).
- `frontend/src/components/AdminDashboard.test.tsx`
  - Add tests covering the double-confirmation flow, ensuring the pairings endpoint is not called until the correct code is provided.

## Implementation Steps
1. **State & Helpers**: Introduce modal control state (`isStartModalOpen`, `startStep`, `confirmInput`, `confirmError`) and helpers to open/close and validate the code.
2. **UI Flow**: Wrap the Start Round button logic so round 0 opens the modal; other rounds continue to call the existing pairing generation. Modal shows warnings (step 1) then code entry (step 2) with button disable until the code matches.
3. **Translations**: Add new keys for all modal labels, errors, and prompts in EN/PT dictionaries.
4. **Tests**: Extend `AdminDashboard.test.tsx` to cover the modal sequence, code mismatch handling, and that `/pairings` is only called after valid confirmation.

## Validation Plan
- Automated: Run `npm test -- AdminDashboard.test.tsx` to verify new UI behavior and existing coverage for Admin Dashboard flows.
- Manual smoke: Create a tournament in the UI, click “Start Round 1,” confirm the two-step modal appears, type the correct code to enable the final button, and observe pairings generation plus websocket updates.
