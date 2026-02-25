# Implementation Plan: Frontend Role-Based Navigation

## Phase 1: Global Role Management

- [x] Task: Create `RoleContext` and hook for global role state be5bddd
  - [x] Define `UserRole` type ('ADMIN', 'PLAYER').
  - [x] Implement `RoleProvider` with state management and persistence (localStorage).
  - [x] Create `useRole` hook for accessing role and update function.
- [ ] Task: Write tests for `RoleProvider`
  - [ ] Test that initial role is loaded from `localStorage` (if present) or defaults correctly.
  - [ ] Test that updating the role persists it to `localStorage`.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Global Role Management' (Protocol in workflow.md)

## Phase 2: Navigation Component

- [ ] Task: Create `NavigationBar` component with role selection dropdown
  - [ ] Use TailwindCSS for a modern look.
  - [ ] Add a dropdown to select between 'Administrator' and 'Player'.
  - [ ] Connect the dropdown to the `useRole` hook.
- [ ] Task: Write tests for `NavigationBar`
  - [ ] Test that the dropdown correctly displays the current role.
  - [ ] Test that selecting a new role calls the update function from the context.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Navigation Component' (Protocol in workflow.md)

## Phase 3: Route Protection and Integration

- [ ] Task: Update `App.tsx` to include `RoleProvider` and `NavigationBar`
  - [ ] Wrap the application with `RoleProvider`.
  - [ ] Place `NavigationBar` at the top of the main layout.
- [ ] Task: Implement `ProtectedRoute` component for role-based access
  - [ ] Component that redirects based on the active role and the target path.
- [ ] Task: Secure existing routes in `App.tsx`
  - [ ] Wrap `/admin` with a check for 'ADMIN' role.
  - [ ] Wrap `/join` and `/:code` with a check for 'PLAYER' role.
- [ ] Task: Write integration tests for route protection
  - [ ] Test that navigating to `/admin` redirects if role is 'PLAYER'.
  - [ ] Test that navigating to `/join` redirects if role is 'ADMIN'.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Route Protection and Integration' (Protocol in workflow.md)
