# Geody

Geody is a real-time multiplayer geography game for classrooms. A teacher creates a room, students join with a short code, and everyone plays rounds guessing countries or capitals on a 3D globe.

## Main Purpose

- Turn geography practice into a fast, collaborative classroom activity.
- Provide live room-based gameplay with instant feedback and scoring.
- Keep setup simple for teachers and students (no accounts required).

## Architecture

Geody is a TypeScript monorepo with npm workspaces:

- `client/`: React + Vite SPA, 3D globe with Three.js (`@react-three/fiber`, `drei`), Socket.IO client.
- `server/`: Node.js + Express + Socket.IO server, in-memory room and game state.
- `shared/`: Shared types and constants used by client and server.

Runtime model:

- Frontend and backend communicate through Socket.IO events.
- Rooms are ephemeral and stored only in memory (no database).
- Authoritative game logic and validation run on the server.

## Tech Stack

- Frontend: React 18, TypeScript, Vite, Three.js
- Backend: Node.js, Express, Socket.IO
- Shared: TypeScript package with contracts/events
- Testing: Vitest (client/server workspaces)

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Install

```bash
npm install
```

### Run Full App in Development

```bash
npm run dev
```

By default:

- Client: `http://localhost:5173`
- Server: `http://localhost:3001`

### Run Server Only

```bash
npm run dev:server
```

This command auto-builds `shared/` before starting the server watcher.

### Build and Run Server (production-like)

```bash
npm run build --workspace=server
npm run start --workspace=server
```

## Environment Variables

Server (`server/.env`):

```env
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```

Client (`client/.env`):

```env
VITE_SERVER_URL=http://localhost:3001
```

## Scripts

- `npm run dev`: Run client and server concurrently
- `npm run dev:client`: Run client only
- `npm run dev:server`: Build `shared` and run server watcher
- `npm run build`: Build shared, client, and server
- `npm test`: Run workspace tests

## Project Structure

```text
geody/
|- client/   # React app (UI, lobby, game, globe)
|- server/   # Express + Socket.IO backend
|- shared/   # Shared types/events/constants
|- SPEC.md
`- ARCHITECTURE.md
```

## Troubleshooting

If you see:

`ERR_MODULE_NOT_FOUND ... node_modules/@geody/shared/dist/types.js`

then `shared/` was not built yet. Run:

```bash
npm run build --workspace=shared
npm run dev:server
```

## Roadmap Notes for Open Source

- Add CI workflow (build + tests) for pull requests.
- Add issue/PR templates and `CONTRIBUTING.md`.
- Add deployment notes for GitHub Pages (client) + Render (server).

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE).
