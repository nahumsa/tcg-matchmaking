# Initial Concept
I want to build a backend and frontend for a swiss matchmaking system. The backend must be written in python and the frontend on react.
Users should connect to a random letter code which is created when an administrator create a tournament.

# Product Definition: Swiss Matchmaking System

## Product Vision
To provide a simple, robust, and accessible Swiss-system matchmaking platform for tournament organizers and participants, using a minimalist and focused interface for clear communication of pairings and standings.

## Target Users
- **Tournament Administrators:** Responsible for creating tournaments, generating codes, and overseeing match progress.
- **Tournament Participants:** Players who join with a code, view pairings, and report their match results.
- **Spectators:** Users who want to view current standings and match history without participating.

## Core Goals
- **Automated Swiss Pairings:** Automatically calculate pairings for each round based on Swiss-system rules.
- **Real-time Updates:** Instantly show new pairings and updated standings to all connected users as results are reported.
- **Easy Access via Code:** Allow participants to join a tournament quickly using a simple, unique room code.
- **Role-Based Interface:** Distinct views and specialized tools for Administrators and Participants.

## Key Features
- **Tournament Management:** Creation of tournaments, setting round counts, and generating room codes.
- **Tournament Lifecycle:** Formalized states (Active, Completed) with data freeze enforcement upon conclusion.
- **Participant Management:** Administrators can view all joined players, manually add participants, and remove them.
- **Real-time Activity Monitoring:** A live log of tournament events (e.g., player joins) for administrators.
- **Match Result Reporting:** A way for players or admins to submit scores for each round.
- **Swiss Pairing Engine:** An algorithm that correctly pairs players with similar scores and prevents repeat matches.
- **Detailed Standings & Tie-breakers:** Real-time standings with win/loss/draw records and OMW% (Opponent Match Win percentage) calculations.
- **Player Insights:** Players can see their own rank, performance record, and potential future opponents.
- **Global Results Export:** Ability to export final tournament standings as a text-based summary.
- **Role-Based Navigation:** A persistent role selection system that provides tailored views for different user types.

## User Experience & UI Style
- **Minimalist and Focused:** A simple, direct interface that prioritizes pairings and results with minimal distractions.
- **Real-time Synchronization:** Data will be updated in real-time to ensure all users see the latest pairings and results without manual refreshes.
- **Intuitive Role Selection:** A dedicated landing page for first-time users to choose their role, with a persistent dropdown for quick switching.
