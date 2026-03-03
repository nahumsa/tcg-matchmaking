# Implementation Plan: Fix Cloud 404 and Standardize Tournament URL

## Phase 1: Frontend Routing & Internal Links [checkpoint: 533b37a]
Focuses on updating the application logic to use the new `/tournament/:code` structure.

- [x] Task: Update React Router Configuration
    - [x] Write tests in `App.test.tsx` to verify that `/tournament/:code` renders `TournamentView` and `/:code` redirects to `/tournament/:code`.
    - [x] Modify `App.tsx` to update the route path and implement the redirect.
- [x] Task: Update Admin Dashboard Links
    - [x] Write/update tests for `AdminDashboard.tsx` to verify the "Public View" link points to `/tournament/:code`.
    - [x] Update `AdminDashboard.tsx` to use the new path format.
- [x] Task: Update Participant Join Redirection
    - [x] Write/update tests for `ParticipantJoin.tsx` to verify redirection to `/tournament/:code` after successful join.
    - [x] Update `ParticipantJoin.tsx` to use the new path format.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Frontend Routing & Internal Links' (Protocol in workflow.md)

## Phase 2: Infrastructure & Docker Configuration
Focuses on ensuring the Nginx configuration correctly handles deep links in the containerized environment.

- [x] Task: Verify Nginx SPA Routing Configuration
    - [x] Inspect `frontend/nginx.conf` and ensure `try_files $uri $uri/ /index.html;` is present and correctly scoped.
    - [x] Update the config if necessary to ensure nested paths (like `/tournament/ABC`) are handled by `index.html`.
- [x] Task: Validate Dockerfile Build Process
    - [x] Verify that `frontend/Dockerfile` correctly copies the local `nginx.conf` to `/etc/nginx/conf.d/default.conf`.
    - [x] Build the image locally to ensure the configuration is applied.
- [x] Task: Conductor - User Manual Verification 'Phase 2: Infrastructure & Docker Configuration' (Protocol in workflow.md)

## Phase 3: End-to-End Validation
Final check to ensure the 404 issue is resolved in a containerized environment.

- [x] Task: E2E Verification in Docker Compose
    - [x] Run the full stack using `docker compose up`.
    - [x] Verify that navigating directly to `http://localhost:8080/tournament/TEST` (manual refresh) works correctly.
    - [x] Verify that navigating to `http://localhost:8080/TEST` correctly redirects.
- [x] Task: Conductor - User Manual Verification 'Phase 3: End-to-End Validation' (Protocol in workflow.md)
