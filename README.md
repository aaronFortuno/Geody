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

## Deploy (Render + GitHub Pages)

This project is split deployment:
- Backend (`server`) on Render
- Frontend (`client`) on GitHub Pages

### 1. Push project to GitHub

1. Create a GitHub repository (for example `geody`).
2. Push this monorepo to `main`.
3. No manual base-path edit is required:
   - `client/vite.config.ts` uses relative base (`./`) by default, so GitHub Pages works regardless of repository name/casing.

### 2. Deploy server to Render

1. In Render, click `New +` → `Web Service`.
2. Connect your GitHub repo and select this repository.
3. Use these settings:
   - Runtime: `Node`
   - Branch: `main`
   - Root Directory: leave empty (repo root)
   - Build Command:
     ```bash
     npm ci --include=dev && npm run build --workspace=server
     ```
   - Start Command:
     ```bash
     npm run start --workspace=server
     ```
4. Add environment variables in Render:
   - `NODE_ENV=production`
   - `PORT=10000` (Render default for web services)
   - `CLIENT_ORIGIN=https://<your-github-username>.github.io`
     (origin only, no repo path)
5. Deploy and wait for success.
6. Open `https://<your-render-service>.onrender.com/health` and confirm JSON response with `"status":"ok"`.

### 3. Deploy client to GitHub Pages

Create a workflow at `.github/workflows/deploy-pages.yml`:

```yaml
name: Deploy Client to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"
      - run: npm ci
      - run: npm run build --workspace=client
        env:
          VITE_SERVER_URL: https://<your-render-service>.onrender.com
      - uses: actions/upload-pages-artifact@v3
        with:
          path: client/dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Then enable Pages:
1. GitHub repo → `Settings` → `Pages`.
2. Source: `GitHub Actions`.
3. Push to `main` (or run workflow manually).
4. Open `https://<your-github-username>.github.io/<your-repo-name>/`.

### 4. Final checks

1. Open the frontend URL.
2. Create a room as host.
3. Join from another tab/device.
4. Confirm answers, scoring and round transitions work.

If you see CORS errors in browser console:
- Recheck Render `CLIENT_ORIGIN` is exactly your site origin
  (example: `https://aaronfortuno.github.io`, not `https://aaronfortuno.github.io/Geody`).
- Rebuild/redeploy both server and client after env changes.

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

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE).
