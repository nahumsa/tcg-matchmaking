# Implementation Plan: Admin Dashboard Player Count

## Objective

Allow admins to see the total number of registered players in a tournament directly on the Admin Dashboard.

## Key Files & Context

- `frontend/src/components/AdminDashboard.tsx`: Renders the Admin dashboard. It already maintains a `participants` array in its state, which is automatically updated via websockets when players join or are removed.
- `frontend/src/i18n.tsx`: Manages the English and Portuguese localization strings for the frontend application.

## Implementation Steps

1. **Update Localization Strings (`frontend/src/i18n.tsx`)**
   - Add a new translation key for the players label to support pluralization or a generic label.
   - In the English dictionary (`en`): Add `adminPlayers: 'Players',` (or similar).
   - In the Portuguese dictionary (`pt`): Add `adminPlayers: 'Jogadores',` (or similar).

2. **Update Admin Dashboard UI (`frontend/src/components/AdminDashboard.tsx`)**
   - Locate the tournament header section where the tournament name and code are displayed (around line 344-348).
   - Add a new styled badge next to the tournament code badge to display the participant count.
   - Use the `participants.length` property to show the current number of players dynamically.
   - Example update:

     ```tsx
     <div className="flex items-center space-x-4 mt-2">
       <span className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold tracking-widest uppercase">
         {tournament.code}
       </span>
       {/* New badge for player count */}
       <span className="bg-green-600 text-white px-3 py-1 rounded text-sm font-bold tracking-widest uppercase">
         {participants.length} {t('adminPlayers')}
       </span>
       <Link to={`/tournament/${tournament.code}`} target="_blank" className="text-blue-600 hover:underline text-sm font-medium">
         {t('adminPublicView')}
       </Link>
     </div>
     ```

## Verification & Testing

1. **Initial State:** Create a new tournament as an Admin and verify that the player count badge reads `0 Players` (or `0 Jogadores` in Portuguese).
2. **Dynamic Update:** Register a new player in another browser tab using the tournament code. Return to the Admin Dashboard and ensure the player count updates instantly without requiring a page refresh.
3. **Localization:** Switch the application language to Portuguese and verify the label translates correctly.
