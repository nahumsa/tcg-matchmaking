# Specification: Player Match Reporting

**Track ID:** `player_match_reporting_20260304`

## Overview
Enable tournament participants to report and edit their own match scores directly from the interface, reducing the administrative burden on tournament organizers and providing immediate feedback to players.

## Functional Requirements
1.  **Report Action:** Participants can find a "Report Score" button on their specific pairing within the Tournament View.
2.  **Single Submitter Flow:** Only one participant from a pairing needs to submit the score. The result is immediately applied to both players.
3.  **Preset Scoring:** The reporting interface will use preset best-of-3 match scores (e.g., 2-0, 2-1, 1-2, 0-2, 1-1 Draw).
4.  **Edit Capability:** Players can edit a previously submitted score at any time until the current round is officially closed or the tournament is completed.
5.  **Admin Override:** Tournament administrators retain full authority to override any player-reported score at any time.
6.  **Real-time Synchronization:** When a score is reported or edited, all connected users (including the opponent and administrators) should see the update immediately via WebSockets.

## Acceptance Criteria
- A player can click a "Report Score" button on their current match and select a result (e.g., "2-0").
- The reported result is immediately visible to both the reporter, their opponent, and the admin.
- The reporter (or their opponent) can change the score later, and the new result is reflected everywhere.
- The tournament standings update automatically to include the new match data.
- Admins can change a player-reported score, and the admin's change is final (unless edited again by an admin).

## Out of Scope
- Automated "dispute" flagging system (players should contact an admin manually if they disagree and can't agree on an edit).
- Custom point entry (restricted to the preset best-of-3 format).
