# Implementation Plan: Fix Cloud 404 and Standardize Tournament URL

## Phase 1: Frontend Routing & Internal Links
Focuses on updating the application logic to use the new `/tournament/:code` structure.

- [ ] Task: Update React Router Configuration
    - [ ] Write tests in `App.test.tsx` to verify that `/tournament/:code` renders `TournamentView` and `/:code` redirects to `/tournament/:code`.
    - [ ] Modify `App.tsx` to update the route path and implement the redirect.
- [ ] Task: Update Admin Dashboard Links
    - [ ] Write/update tests for `AdminDashboard.tsx` to verify the "Public View" link points to `/tournament/:code`.
    - [ ] Update `AdminDashboard.tsx` to use the new path format.
- [ ] Task: Update Participant Join Redirection
    - [ ] Write/update tests for `ParticipantJoin.tsx` to verify redirection to `/tournament/:code` after successful join.
    - [ ] Update `ParticipantJoin.tsx` to use the new path format.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Frontend Routing & Internal Links' (Protocol in workflow.md)

## Phase 2: Infrastructure & Docker Configuration
Focuses on ensuring the Nginx configuration correctly handles deep links in the containerized environment.

- [ ] Task: Verify Nginx SPA Routing Configuration
    - [ ] Inspect `frontend/nginx.conf` and ensure `try_files $uri $uri/ /index.html;` is present and correctly scoped.
    - [ ] Update the config if necessary to ensure nested paths (like `/tournament/ABC`) are handled by `index.html`.
- [ ] Task: Validate Dockerfile Build Process
    - [ ] Verify that `frontend/Dockerfile` correctly copies the local `nginx.conf` to `/etc/nginx/conf.d/default.conf`.
    - [ ] Build the image locally to ensure the configuration is applied.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Infrastructure & Docker Configuration' (Protocol in workflow.md)

## Phase 3: End-to-End Validation
Final check to ensure the 404 issue is resolved in a containerized environment.

- [ ] Task: E2E Verification in Docker Compose
    - [ ] Run the full stack using `docker compose up`.
    - [ ] Verify that navigating directly to `http://localhost:8080/tournament/TEST` (manual refresh) works correctly.
    - [ ] Verify that navigating to `http://localhost:8080/TEST` correctly redirects.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: End-to-End Validation' (Protocol in workflow.md)
