# PR Review Notes

## Summary
This branch introduces player self-reporting, table ordering updates, CI automation, and related test updates across backend and frontend.

## Blocking Findings

1. **Legacy match reporting endpoint allows privilege escalation**
   - Endpoint: `POST /matches/{match_id}/report`
   - In `backend/app/api/matches/router.py`, when `is_admin` is false and `reported_by_id` is omitted, the handler force-sets `update.is_admin = True`.
   - This allows a caller to gain admin reporting behavior by simply omitting `reported_by_id`, which bypasses the participant authorization checks in the new protected endpoint.
   - Recommendation: remove the implicit admin escalation and require explicit authorization for all write paths.

## Non-blocking Observations

- Match score schema currently permits any integers (including negative values). Consider adding validation constraints if negative scores are invalid in your domain.
