# Specification: Fix Cloud 404 and Standardize Tournament URL

## Overview
The tournament public page is currently accessed via `/:code`, but users are trying to access it via `/tournament/:code`. In the Docker environment, this results in a server-level Nginx 404 error because the SPA routing is not properly handled for nested paths, and the application does not have a route defined for `/tournament/:code`. This track will standardize the tournament view URL to `/tournament/:code`, update all internal links, and ensure Nginx is correctly configured for SPA deep links.

## Functional Requirements
1.  **Update Routing**: Modify `App.tsx` to change the `TournamentView` route from `/:code` to `/tournament/:code`.
2.  **Update Admin Dashboard**: Update the "Public View" link in `AdminDashboard.tsx` to point to `/tournament/{code}`.
3.  **Update Join Flow**: Update `ParticipantJoin.tsx` to redirect users to `/tournament/{code}` after joining.
4.  **Fix Nginx Configuration**: Ensure `frontend/nginx.conf` is correctly applied in the Docker container and that `try_files` properly redirects all routes to `index.html`.
5.  **Backward Compatibility**: Add a redirect from the root `/:code` to `/tournament/:code` to handle existing links or manual entries.

## Acceptance Criteria
- Accessing `http://<domain>/tournament/ABCD` correctly renders the `TournamentView` for tournament ABCD.
- Refreshing the page at `http://<domain>/tournament/ABCD` does not result in an Nginx 404.
- All internal "Public View" and redirect links correctly use the `/tournament/:code` format.
- Accessing the old `http://<domain>/ABCD` redirect to `http://<domain>/tournament/ABCD`.
