# Geody — CLAUDE.md

## Estructura del projecte

Monorepo npm workspaces amb 3 paquets: `shared`, `client`, `server`.

```
geody/
├── shared/          @geody/shared — tipus TypeScript compartits
├── client/          @geody/client — SPA React + Three.js
└── server/          @geody/server — Node.js + Socket.IO
```

## Comandes principals

```bash
npm run dev          # Client (port 5173) + servidor (port 3001) en paral·lel
npm run dev:client   # Només client
npm run dev:server   # Només servidor
npm run test         # Tests de tots els paquets
npm install          # Instal·la dependències de tots els workspaces
```

## Convencions

- TypeScript estricte arreu (`"strict": true`)
- Stubs amb `throw new Error("Not implemented")` — mai retornar undefined silenciós
- Tots els events Socket.IO tipats via `ClientToServerEvents` / `ServerToClientEvents`
- La validació de respostes és **exclusiva del servidor** (anti-trampes)
- `normalize()` del client i del servidor han de ser **idèntiques**
- Cap persistència: tot viu en memòria al servidor

## Fitxers clau

- `shared/types.ts`              — tots els tipus + catàleg d'events
- `server/src/socket/handlers.ts`— tots els handlers Socket.IO
- `server/src/data/countries.json`  — 73 països base
- `server/src/data/locales/ca.json` — noms en català (IEC)
- `client/src/hooks/useGame.ts`  — estat central del joc al client
- `ARCHITECTURE.md`              — especificació completa per a implementació
