# Specification: Player Management & Standings

## Overview
This track enhances the tournament experience by providing administrators with better visibility and control over participants and giving players more insight into their performance and future matchups.

## Functional Requirements

### 1. Unique Player Names
- When a player joins a tournament, the system must verify that the chosen name is unique within that specific tournament.
- If the name is already taken, the player should receive an error message and be prevented from joining.

### 2. Admin Player Management (Dashboard Section)
- The Administrator Dashboard will include a dedicated section listing all joined players.
- **Admin Actions:**
    - **View List:** See all players by name.
    - **Remove Player:** Delete a player from the tournament.
    - **Manual Add:** Add a player directly to the tournament.

### 3. Player Standings View
- Players can view their current status in the tournament.
- **Data Points:**
    - Current Rank (numerical position).
    - Total Points.
    - Win/Loss/Draw record.
    - Tie-breakers (specifically OMW% - Opponent Match Win percentage).

### 4. Potential Pairings
- Players can view a list of "Potential Opponents" for the upcoming round.
- **Logic:** Filter players who have the same or similar scores and whom the current player has not yet faced in the tournament.

## Acceptance Criteria
- [ ] Attempting to join a tournament with an existing name returns a clear error message.
- [ ] Admin dashboard displays a list of all participants.
- [ ] Admin can manually add a player.
- [ ] Admin can remove a player.
- [ ] Player view displays Rank, Points, Record, and OMW% correctly.
- [ ] Player view lists unplayed opponents within the same or adjacent score brackets.

## Out of Scope
- Editing existing player names.
- Manual pairing overrides.
- Complex tie-breakers beyond OMW%.
