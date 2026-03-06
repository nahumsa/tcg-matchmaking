# Frontend (React + TypeScript + Vite)

This directory contains the tournament UI used by both organizers and players.

## Main usability behaviors

- Responsive top navigation with direct access to **Dashboard**, **Join**, and latest **Standings** link (when available in local storage).
- Client-side validation for creating tournaments and joining tournaments.
- Controlled score inputs in the admin round view for safer score reporting.
- Tournament live view includes a websocket connection badge (`Connected`, `Reconnecting...`, `Connecting...`).

## Commands

From this folder:

```bash
npm install
npm run dev
npm run test -- --run
npm run lint
```

Or from repository root:

```bash
npm --prefix frontend test -- --run
npm --prefix frontend run lint
```
