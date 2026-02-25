# Specification: Frontend Role-Based Navigation

## Overview
This track involves implementing a role-based navigation system on the frontend. Users should be able to choose between "Administrator" and "Player" roles via a dropdown menu in the navigation bar. This selection should be persisted and strictly control which views are accessible to the user.

## Functional Requirements
- **Role Selection:** A dropdown menu in the navigation bar to select between "Administrator" and "Player".
- **Role Persistence:** The selected role must be saved (e.g., in `localStorage`) so it persists across page refreshes.
- **Strict View Separation:**
    - If "Administrator" is selected, only the admin dashboard and related administrative views should be accessible.
    - If "Player" is selected, only the participant join, tournament view, and related player views should be accessible.
- **Redirection:** If a user tries to access a view that doesn't belong to their current role, they should be redirected to the appropriate "home" for their role or prompted to switch roles.

## Non-Functional Requirements
- **Consistency:** Use existing UI components and TailwindCSS for styling.
- **Accessibility:** Ensure the dropdown and navigation are accessible.

## Acceptance Criteria
- Role selection dropdown is visible in the navigation bar.
- Changing the role immediately updates the available views/routes.
- Role selection persists after refreshing the page.
- Admin views are inaccessible when "Player" role is active.
- Player views are inaccessible when "Administrator" role is active.

## Out of Scope
- **Backend Authentication:** This track focuses on frontend role selection and navigation, not backend user authentication or permissions.
