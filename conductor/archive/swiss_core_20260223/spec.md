# Track Specification: Swiss Core System

## Overview
This track focuses on implementing the foundational features of the Swiss Matchmaking System, including tournament creation, participant joining via random letter codes, and the core Swiss pairing engine.

## Functional Requirements
- **Tournament Creation:** Administrators can create a tournament, specifying its name and the number of rounds.
- **Random Letter Code Generation:** Upon creation, each tournament is assigned a unique 6-character uppercase letter code.
- **Player Joining:** Participants can join an active tournament by entering its unique code.
- **Swiss Pairing Engine (V1):**
    - Automatically generate pairings for each round based on participants' current scores.
    - Prevent duplicate matches within the same tournament.
    - Correctly handle "Byes" for an odd number of players.
- **Standings Management:** Calculate and display real-time standings after each round based on match results.

## Technical Architecture
- **Backend (Python/FastAPI):**
    - REST API endpoints for tournament management and player registration.
    - WebSocket support for real-time updates of pairings and standings.
    - PostgreSQL database for persistent storage.
- **Frontend (React/TailwindCSS):**
    - Admin dashboard for creating and managing tournaments.
    - Participant view for joining and viewing match pairings.
    - Minimalist and focused UI design as per product guidelines.

## Success Criteria
- [ ] Administrators can successfully create a tournament and receive a unique code.
- [ ] Participants can join a tournament using the generated code.
- [ ] The Swiss pairing engine correctly generates pairings for at least three rounds without duplicates.
- [ ] Real-time updates reflect accurately on all connected participant screens.
