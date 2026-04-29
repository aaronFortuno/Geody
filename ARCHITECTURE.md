# ARCHITECTURE.md — Geody
## Document de referència per a implementació

> **Destinatari**: agent de codi (qwen-coder o equivalent).
> Tots els stubs estan a la seva localització final. Cada mètode té la seva
> signatura, comportament esperat i casos límit descrits aquí.
> La tasca és implementar el cos de cada funció marcada amb `// TODO: implement`.

---

## 1. Context i regles generals

- **Monorepo npm workspaces**: `shared/`, `client/`, `server/`.
- **TypeScript estricte** arreu: `"strict": true`, sense `any` implícit.
- **Zero persistència**: totes les sales viuen en memòria. Si el servidor reinicia, les sales es perden.
- **Validació al servidor**: cap validació de resposta al client (anti-trampes).
- **`normalize()` simètrica**: la implementació de `client/src/utils/normalize.ts` i `server/src/validation/AnswerValidator.ts#normalize` han de ser byte-per-byte idèntiques.
- **Stubs**: tots els mètodes no implementats fan `throw new Error("Not implemented")`. Mai retornar `undefined` o `null` silenciosament.

---

## 2. Dependències i versions

### shared (sense dependències de runtime)
```
typescript ^5.3
```

### server
```
express          ^4.18   — HTTP + /health endpoint
socket.io        ^4.7    — WebSocket bidireccional
cors             ^2.8    — CORS per a l'origen de GitHub Pages
express-rate-limit ^7.4  — Rate limiting de creació de sales
tsx              ^4.7    — Execució TypeScript directa (dev)
```

### client
```
react + react-dom        ^18.2
@react-three/fiber       ^8.15   — Renderer React per a Three.js
@react-three/drei        ^9.95   — Helpers: OrbitControls, etc.
three                    ^0.160
socket.io-client         ^4.7
vitest + @testing-library/react  — tests
```

---

## 3. Estructura del repositori

```
geody/
├── package.json          ← workspace root (concurrently per a dev)
├── .gitignore
├── SPEC.md               ← especificació de producte
├── CLAUDE.md             ← guia per a agents de codi
├── ARCHITECTURE.md       ← aquest fitxer
│
├── shared/
│   ├── package.json      name: @geody/shared
│   └── types.ts          ← TOTS els tipus i interfaces compartits
│
├── server/
│   ├── package.json      name: @geody/server, type: "module"
│   ├── tsconfig.json     target: ES2022, paths: @geody/shared → ../shared/types.ts
│   ├── .env.example
│   └── src/
│       ├── index.ts              ← Express + Socket.IO bootstrap
│       ├── rooms/
│       │   ├── Room.ts           ← Classe Room (model de dades en memòria)
│       │   └── RoomManager.ts    ← CRUD de sales, cleanup, codis únics
│       ├── game/
│       │   ├── GameEngine.ts     ← Orquestrador del flux de joc
│       │   ├── RoundGenerator.ts ← Generació aleatòria de rondes
│       │   └── ScoreCalculator.ts← Fórmula de puntuació
│       ├── validation/
│       │   └── AnswerValidator.ts← Validació i normalització de respostes
│       ├── data/
│       │   ├── CountryLoader.ts  ← Carrega i fusiona countries.json + locales/
│       │   ├── countries.json    ← 73 països: ISO3, ISO2, continent, coordenades
│       │   └── locales/
│       │       └── ca.json       ← Noms en català (IEC)
│       └── socket/
│           └── handlers.ts       ← Tots els handlers Socket.IO (exportats per a tests)
│
└── client/
    ├── package.json      name: @geody/client, type: "module"
    ├── tsconfig.json     jsx: react-jsx, paths: @geody/shared → ../shared/types.ts
    ├── tsconfig.node.json
    ├── vite.config.ts    base: "/geody/", alias: @geody/shared
    ├── index.html
    └── src/
        ├── main.tsx              ← createRoot
        ├── App.tsx               ← Routing d'estats (home/lobby/joc/resultats)
        ├── index.css             ← Variables CSS globals + reset
        ├── test-setup.ts         ← @testing-library/jest-dom setup
        ├── types/index.ts        ← Re-export de @geody/shared + GeoJSONCountryFeature
        ├── i18n/ca.json          ← Totes les cadenes de la UI en català
        ├── utils/
        │   └── normalize.ts      ← Ha de ser idèntic al servidor
        ├── hooks/
        │   ├── useSocket.ts      ← Connexió Socket.IO (lifecycle)
        │   ├── useGame.ts        ← Estat central del joc (reducer + subscripcions)
        │   └── useTimer.ts       ← Compte enrere sincronitzat amb servidor
        └── components/
            ├── Globe/
            │   ├── Globe.tsx         ← Canvas Three.js + controls
            │   ├── GlobeCountry.tsx  ← Mesh extrudit per país
            │   └── index.ts
            ├── Game/
            │   ├── GameScreen.tsx    ← Layout principal (joc actiu)
            │   ├── AnswerInput.tsx   ← Input + feedback visual
            │   ├── Timer.tsx         ← Visualització del temporitzador
            │   ├── Scoreboard.tsx    ← Classificació en temps real
            │   ├── RoundResults.tsx  ← Resultats d'una ronda
            │   ├── FinalResults.tsx  ← Resultats finals + podi
            │   └── index.ts
            ├── Lobby/
            │   ├── HomeScreen.tsx    ← Pantalla d'inici
            │   ├── HostLobby.tsx     ← Lobby del professor
            │   ├── PlayerLobby.tsx   ← Lobby de l'alumne
            │   └── index.ts
            └── UI/
                ├── Button.tsx
                ├── Input.tsx
                ├── Podium.tsx
                └── index.ts
```

---

## 4. Variables d'entorn

### server/.env (no commitejat; exemple a .env.example)
```
PORT=3001
CLIENT_ORIGIN=http://localhost:5173       # Dev: localhost. Prod: URL de GitHub Pages
NODE_ENV=development
```

### client (Vite — prefix VITE_)
```
VITE_SERVER_URL=http://localhost:3001     # Dev. Prod: URL de Render
```

---

## 5. Convencions de disseny

### 5.1 TypeScript
- Sempre `interface` per a formes d'objecte; `type` per a unions i interseccions.
- Cap `as unknown as X`; fer el cast correctament o revisar el tipus.
- `Record<string, V>` en comptes de `{ [key: string]: V }`.
- Tots els payloads de Socket.IO tipats via `ClientToServerEvents` / `ServerToClientEvents` de `shared/types.ts`.

### 5.2 Nomenclatura
- Fitxers de components: PascalCase (`GlobeCountry.tsx`)
- Hooks: camelCase amb prefix `use` (`useGame.ts`)
- Classes: PascalCase (`RoomManager`)
- Constants: SCREAMING_SNAKE_CASE (`MAX_PLAYERS`)
- ISO3 sempre en majúscules (`"ESP"`, `"FRA"`)
- Locales en minúscules (`"ca"`, `"es"`, `"en"`)

### 5.3 Gestió d'errors al servidor
- Els handlers de Socket.IO mai han de llençar excepcions cap amunt.
- Tota lògica de negoci va en blocs `try/catch`.
- En cas d'error conegut: `socket.emit("room:error", { message, code })`.
- En cas d'error inesperat: `console.error(error)` i `socket.emit("room:error", { message: "Error intern", code: "INTERNAL" })`.

### 5.4 Rate limiting (mode "fastest")
- Guardar un `Map<playerId, lastAnswerTimestamp>` per sala.
- Si `Date.now() - last < 1000`: ignorar la resposta silenciosament (no emetre error).

### 5.5 CSS
- Usar les variables CSS de `index.css` (no valors hardcoded).
- Cap framework CSS extern (ni Tailwind, ni Bootstrap). CSS pur o CSS Modules.
- Mida mínima de tot element interactiu: `min-height: 44px; min-width: 44px`.
- Font-size d'inputs: mínim `16px` per evitar zoom en iOS.

---

## 6. Mòdul: shared/types.ts

Exporta tots els tipus del projecte. **No afegir lògica aquí.**

### Tipus clau
| Tipus | Propòsit |
|-------|---------|
| `CountryData` | Model d'un país (base + noms per locale) |
| `Room` | Model d'una sala (server-only, però el tipus és compartit) |
| `Player` | Jugador dins una sala |
| `GameConfig` | Configuració d'una partida |
| `Round` | Una ronda (objectiu + respostes) |
| `PlayerAnswer` | Resposta d'un jugador |
| `RoundResult` | Resum de resultats d'una ronda |
| `GameResult` | Resum final + podi |
| `ClientToServerEvents` | Catàleg tipat d'events C→S |
| `ServerToClientEvents` | Catàleg tipat d'events S→C |

### Constant important
```typescript
DEFAULT_GAME_CONFIG: GameConfig  // valors per defecte per al formulari del lobby
```

---

## 7. Mòdul: server/

### 7.1 `src/rooms/Room.ts`

**Classe `Room`** — model en memòria d'una sala.

#### Constructor
```typescript
new Room(code: string, hostId: string, locale: string)
```
- Inicialitza `players` com a `new Map()`
- `config` = `{ ...DEFAULT_GAME_CONFIG, locale }`
- `state` = `"lobby"`, `currentRound` = `0`, `rounds` = `[]`
- `createdAt` = `lastActivityAt` = `Date.now()`

#### Mètodes a implementar

**`getHost(): Player | undefined`**
- Retorna `this.players.get(this.hostId)`

**`isFull(): boolean`**
- `this.players.size >= Room.MAX_PLAYERS`

**`getLeaderboard(): Player[]`**
- `Array.from(this.players.values()).sort((a, b) => b.score - a.score)`

**`getCurrentRound(): Round | undefined`**
- `this.rounds[this.currentRound]`
- Retorna `undefined` si `this.rounds` és buit o index fora de rang

**`allPlayersAnswered(): boolean`**
- Obté la ronda actual; si no n'hi ha, retorna `false`
- Filtra els jugadors connectats (`p.connected === true` i `!p.isHost`)
- Retorna `true` si TOTS ells tenen una entrada a `round.answers`

**`touch(): void`**
- `this.lastActivityAt = Date.now()` (ja implementat al stub)

---

### 7.2 `src/rooms/RoomManager.ts`

**Classe `RoomManager`** — gestió del cicle de vida de sales.

#### `createRoom(hostId, locale): Room`
1. Crida `this.generateCode()` per obtenir un codi únic.
2. Crea `new Room(code, hostId, locale)`.
3. Afegeix l'amfitrió com a Player: `{ id: hostId, name: "Professor", avatar: "🎓", score: 0, isHost: true, connected: true }`.
   *(El nom "Professor" és placeholder; el nom real no s'estableix fins que l'amfitrió el configuri — a MVP pot quedar com a "Host").*
4. Guarda la sala: `this.rooms.set(code, room)`.
5. Retorna la sala.

#### `deleteRoom(code): void`
- `this.rooms.delete(code)` (si no existeix, no fa res)

#### `addPlayer(code, player): void`
Condicions de falla (llançar `Error` amb missatge específic):
- Sala no trobada → `"ROOM_NOT_FOUND"`
- Sala plena → `"ROOM_FULL"`
- Partida en curs (state !== "lobby") → `"GAME_IN_PROGRESS"`

Si tot OK:
1. Crea el Player complet: `{ ...player, score: 0, isHost: false, connected: true }`
2. `room.players.set(player.id, fullPlayer)`
3. `room.touch()`

#### `removePlayer(code, playerId): void`
1. Obté la sala; si no existeix, retorna silenciosament.
2. Si `playerId === room.hostId`:
   - Marca `room.hostDisconnectedAt = Date.now()` (per al cleanup del TTL)
3. Si existeix: `room.players.get(playerId)!.connected = false`
4. `room.touch()`

#### `reconnectPlayer(code, oldPlayerId, newPlayerId): void`
1. Obté la sala; si no existeix, retorna silenciosament.
2. Obté el Player antic; si no existeix, retorna silenciosament.
3. Crea un nou Player amb el `newPlayerId` però mantenint `name`, `score`, `avatar`, `isHost`.
4. `room.players.delete(oldPlayerId)`, `room.players.set(newPlayerId, updatedPlayer)`.
5. Si era l'amfitrió: `room.hostId = newPlayerId`, `room.hostDisconnectedAt = undefined`.
6. `room.touch()`

#### `setConfig(code, config): void`
- Obté la sala; llança `Error("ROOM_NOT_FOUND")` si no existeix.
- Si `room.state !== "lobby"`: llança `Error("GAME_IN_PROGRESS")`.
- `Object.assign(room.config, config)` (merge parcial)
- `room.touch()`

#### `cleanupInactiveRooms(): void`
Itera `this.rooms.entries()`:
- Si `room.hostDisconnectedAt && (now - room.hostDisconnectedAt) > HOST_RECONNECT_TTL_MS`: `deleteRoom(code)`
- Si `room.state === "lobby" && (now - room.lastActivityAt) > ROOM_IDLE_TTL_MS`: `deleteRoom(code)`

#### `generateCode(): string`
```
do {
  code = 6 caràcters aleatoris de CODE_CHARS
} while (this.rooms.has(code))
return code
```
Usar `Math.random()` és suficient (no cal criptogràfic).

---

### 7.3 `src/game/ScoreCalculator.ts`

#### `calculate(timeRemaining, config, isSpellingPerfect): number`
```
points = config.pointsPerCorrect
       + Math.floor(config.speedBonusMax * (timeRemaining / config.timePerRound))
       + (isSpellingPerfect ? config.spellingBonus : 0)
return Math.max(points, config.pointsPerCorrect)  // mai menys que la base
```
- `timeRemaining` pot ser 0 (quan s'ha esgotat el temps però la resposta ja estava registrada).
- Guardar que `Math.floor` és obligatori.

---

### 7.4 `src/game/RoundGenerator.ts`

#### `generateRounds(config, countries): RoundStub[]`
```
1. filtered = countries.filter(c => config.continents.includes(c.continent))
2. Si filtered.length < config.totalRounds: throw Error("Not enough countries")
3. selected = this.selectCountries(config.continents, config.totalRounds, countries)
4. Per a cada selected[i]:
   type = determineType(config.mode, i)
   correctAnswer = type === "country"
     ? countries[i].names[config.locale].country
     : countries[i].names[config.locale].capital
   return { index: i, type, targetCountryId: selected[i].id, correctAnswer, answers: {} }
```

**`determineType(mode, index)`**:
- `"countries"` → sempre `"country"`
- `"capitals"` → sempre `"capital"`
- `"both"` → `index % 2 === 0 ? "country" : "capital"`

#### `selectCountries(continents, count, countries): CountryData[]`
```
filtered = countries.filter(c => continents.includes(c.continent))
shuffle Fisher-Yates sobre filtered
return filtered.slice(0, count)
```

**Fisher-Yates shuffle** (in-place sobre una còpia):
```
for (let i = arr.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [arr[i], arr[j]] = [arr[j], arr[i]];
}
```

---

### 7.5 `src/game/GameEngine.ts`

#### `startGame(room, countries): Round[]`
1. Verifica `room.state === "lobby"` → sinó `throw Error("Game already started")`
2. `rounds = this.generator.generateRounds(room.config, countries)`
3. `room.rounds = rounds.map(r => ({ ...r, answers: {} }))` — afegeix el camp answers
4. `room.state = "playing"`
5. `room.currentRound = 0`
6. `room.touch()`
7. Retorna `room.rounds`

#### `startRound(room): void`
- `room.rounds[room.currentRound].startedAt = Date.now()`
- `room.touch()`

#### `processAnswer(room, playerId, text, timestamp, countries): AnswerProcessResult`
```
round = room.getCurrentRound()
if (!round || round.endedAt) return { isCorrect: false, ... }

player = room.players.get(playerId)
if (!player || !player.connected) return { isCorrect: false, ... }

// Mode "fastest": comprova si ja ha encertat
if (room.config.gameType === "fastest" && round.answers[playerId]?.isCorrect) {
  return { isCorrect: false, isSpellingPerfect: false, points: 0, totalScore: player.score }
}

// Mode "kahoot" amb allowAnswerChange=false: comprova si ja ha enviat
if (room.config.gameType === "kahoot" && !room.config.allowAnswerChange && round.answers[playerId]) {
  return { isCorrect: false, isSpellingPerfect: false, points: 0, totalScore: player.score }
}

validation = this.validator.validate(text, round.correctAnswer, round.type, room.config.locale, countries)

attempts = (round.answers[playerId]?.attempts ?? 0) + 1

if (validation.isCorrect) {
  timeRemaining = Math.max(0, room.config.timePerRound - (timestamp - round.startedAt!) / 1000)
  points = this.scorer.calculate(timeRemaining, room.config, validation.isSpellingPerfect)
  player.score += points (si mode "fastest")
  // en mode "kahoot", els punts es calculen a endRound
  round.answers[playerId] = { playerId, text, timestamp, isCorrect: true, isSpellingPerfect: validation.isSpellingPerfect, pointsEarned: points, attempts }
  return { isCorrect: true, isSpellingPerfect: validation.isSpellingPerfect, points, totalScore: player.score }
} else {
  round.answers[playerId] = { ..., isCorrect: false, pointsEarned: 0, attempts }
  return { isCorrect: false, flashCountryId: validation.flashCountryId, points: 0, totalScore: player.score }
}
```

#### `endRound(room, countries): RoundResult`
```
round = room.getCurrentRound()!
round.endedAt = Date.now()
room.state = "round-results"

// Mode "kahoot": calcular punts ara
if (room.config.gameType === "kahoot") {
  per cada jugador connectat:
    answer = round.answers[playerId]
    si answer.isCorrect:
      timeRemaining = max(0, config.timePerRound - (answer.timestamp - round.startedAt!) / 1000)
      points = scorer.calculate(timeRemaining, config, answer.isSpellingPerfect)
      answer.pointsEarned = points
      player.score += points
}

scores = per cada jugador: { playerId, name, pointsEarned: answer?.pointsEarned ?? 0, totalScore: player.score, isCorrect: answer?.isCorrect ?? false }
return { roundIndex: round.index, correctAnswer: round.correctAnswer, targetCountryId: round.targetCountryId, scores }
```

#### `endGame(room): GameResult`
```
room.state = "final-results"

Per a cada jugador:
  calcular stats: correctAnswers, perfectSpellings, avgResponseTime, bestStreak

finalScores = jugadors ordenats per score descendent
podium = [finalScores[0], finalScores[1] ?? null, finalScores[2] ?? null]
return { finalScores, podium }
```

**Càlcul de `avgResponseTimeMs`**:
- Per a cada ronda, si el jugador té `answer.isCorrect`: `answer.timestamp - round.startedAt!`
- Fer la mitjana. Si cap encert: 0.

**Càlcul de `bestStreak`**:
- Iterar les rondes en ordre; comptar consells d'encerts consecutius; guardar el màxim.

---

### 7.6 `src/validation/AnswerValidator.ts`

#### `normalize(text): string`
```typescript
return text
  .trim()
  .toLowerCase()
  .normalize("NFD")
  .replace(/[̀-ͯ]/g, "")
  .replace(/\s+/g, " ");
```

#### `validate(answer, correctAnswer, roundType, locale, allCountries): ValidationResult`
```
norm = this.normalize(answer)
normCorrect = this.normalize(correctAnswer)
// Comprovar variants acceptades del país target
country = allCountries.find(c => c.names[locale]?)
variants = country?.names[locale]?.acceptedVariants?.map(normalize) ?? []

isCorrect = norm === normCorrect || variants.includes(norm)
isSpellingPerfect = isCorrect && answer.trim() === correctAnswer

if (!isCorrect):
  flashCountryId = this.findCountryByAnswer(norm, roundType, locale, allCountries)

return { isCorrect, isSpellingPerfect, flashCountryId }
```

#### `findCountryByAnswer(normalizedAnswer, roundType, locale, allCountries): string | undefined`
```
for each country of allCountries:
  localeData = country.names[locale]
  if !localeData: continue
  field = roundType === "country" ? localeData.country : localeData.capital
  if normalize(field) === normalizedAnswer: return country.id
  variants = localeData.acceptedVariants ?? []
  if variants.some(v => normalize(v) === normalizedAnswer): return country.id
return undefined
```

---

### 7.7 `src/data/CountryLoader.ts`

#### `loadCountries(): BaseCountry[]`
```typescript
if (this.countriesCache) return this.countriesCache;
this.countriesCache = require("../data/countries.json") as BaseCountry[];
return this.countriesCache;
```

#### `loadLocale(locale): LocaleData`
```typescript
if (this.localeCache.has(locale)) return this.localeCache.get(locale)!;
try {
  const data = require(`../data/locales/${locale}.json`) as LocaleData;
  this.localeCache.set(locale, data);
  return data;
} catch {
  throw new Error(`Locale not found: ${locale}`);
}
```

#### `getCountriesForLocale(locale): CountryData[]`
```
base = this.loadCountries()
localeData = this.loadLocale(locale)
return base
  .filter(c => localeData[c.id])
  .map(c => ({ ...c, names: { [locale]: localeData[c.id] } }))
```

#### `getCountryName(id, locale): string`
```
localeData = this.loadLocale(locale)
entry = localeData[id]
if (!entry) throw new Error(`Country ${id} not found in locale ${locale}`)
return entry.country
```

#### `getCapitalName(id, locale): string`
- Igual que getCountryName però retorna `entry.capital`

---

### 7.8 `src/socket/handlers.ts`

Tots els handlers han de:
1. Buscar la sala de l'usuari (guardar `socket.data.roomCode` quan s'uneix).
2. Gestionar errors amb `try/catch` i emetre `room:error`.
3. Cridar `room.touch()` en cada operació exitosa.

#### `handleRoomCreate(socket, io, roomManager, { locale })`
```
room = roomManager.createRoom(socket.id, locale)
socket.data.roomCode = room.code
socket.join(room.code)
qrUrl = `${CLIENT_ORIGIN}?code=${room.code}`   // usar process.env.CLIENT_ORIGIN
socket.emit("room:created", { code: room.code, qrUrl })
```

#### `handleRoomJoin(socket, io, roomManager, { code, playerName })`
Validacions:
- `playerName.trim().length === 0 || > 20` → emetre error `INVALID_NAME`
- `!room` → error `ROOM_NOT_FOUND`
- `room.isFull()` → error `ROOM_FULL`
- `room.state !== "lobby"` → error `GAME_IN_PROGRESS`

Si OK:
```
roomManager.addPlayer(code, { id: socket.id, name: playerName.trim() })
socket.data.roomCode = code
socket.join(code)
io.to(code).emit("room:player-joined", {
  player: room.players.get(socket.id)!,
  players: room.getLeaderboard()
})
```

#### `handleGameStart(socket, io, roomManager, gameEngine, countryLoader)`
Validacions:
- `room.hostId !== socket.id` → error `NOT_HOST`
- `room.state !== "lobby"` → error `GAME_IN_PROGRESS`
- `connectedPlayers < 1` → error (missatge personalitzat)

Si OK:
```
countries = countryLoader.getCountriesForLocale(room.config.locale)
gameEngine.startGame(room, countries)
gameEngine.startRound(room)
round = room.getCurrentRound()!
io.to(code).emit("game:round-start", {
  round: { index, type, targetCountryId, correctAnswer: round.correctAnswer },
  timePerRound: room.config.timePerRound
})
startRoomTimer(room, io)   // veure §7.9
```

#### `handleGameAnswer(socket, io, roomManager, gameEngine, countryLoader, { text, roundIndex })`
Validacions:
- Sala no existeix / jugador no a la sala: ignorar
- `roundIndex !== room.currentRound`: ignorar (resposta obsoleta)
- Rate limit (1/s en mode "fastest"): ignorar silenciosament

Si OK:
```
result = gameEngine.processAnswer(room, socket.id, text, Date.now(), countries)
io.to(code).emit("game:answer-result", {
  playerId: socket.id,
  isCorrect: result.isCorrect,
  flashCountryId: result.flashCountryId,
  points: result.points,
  totalScore: result.totalScore
})

if (result.isCorrect && room.config.gameType === "fastest") {
  endCurrentRound(room, io, roomManager, gameEngine, countryLoader)
}
if (room.config.gameType === "kahoot" && room.allPlayersAnswered()) {
  endCurrentRound(room, io, roomManager, gameEngine, countryLoader)
}
```

#### `handleDisconnect(socket, io, roomManager)`
```
code = socket.data.roomCode
if (!code) return
room = roomManager.getRoom(code)
if (!room) return
roomManager.removePlayer(code, socket.id)
io.to(code).emit("room:player-left", { playerId: socket.id })
```

#### Timer al servidor (funció auxiliar, no exportada)
```typescript
function startRoomTimer(room: Room, io: TypedServer): void {
  let remaining = room.config.timePerRound;
  const interval = setInterval(() => {
    remaining--;
    io.to(room.code).emit("game:timer-tick", { remaining });
    if (remaining <= 0) {
      clearInterval(interval);
      // Si la ronda segueix activa, acabar-la
      if (room.state === "playing") {
        endCurrentRound(room, io, ...);
      }
    }
  }, 1000);
  // Guardar l'interval per netejar-lo si la ronda acaba abans de temps
  (room as any)._timerInterval = interval;
}
```

**IMPORTANT**: Netejar l'interval quan `endCurrentRound` s'executa per resposta correcta.

#### Funció auxiliar `endCurrentRound`
```
clearInterval(room._timerInterval)
result = gameEngine.endRound(room, countries)
io.to(code).emit("game:round-end", {
  correctAnswer: result.correctAnswer,
  targetCountryId: result.targetCountryId,
  scores: result.scores
})
```

---

## 8. Mòdul: client/

### 8.1 `utils/normalize.ts`

```typescript
export function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ");
}
```
**Cas de test obligatori**: `normalize("  França ") === "franca"`.

---

### 8.2 `hooks/useSocket.ts`

```typescript
export function useSocket(url?: string) {
  const socketRef = useRef<AppSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const resolvedUrl = url ?? SERVER_URL;

  useEffect(() => {
    const socket = io(resolvedUrl, { autoConnect: true });
    socketRef.current = socket;
    socket.on("connect",    () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    return () => { socket.disconnect(); };
  }, [resolvedUrl]);

  return { socket: socketRef.current, connected };
}
```
**Nota**: Retornar `socketRef.current` directament (no useState del socket) evita re-renders.

---

### 8.3 `hooks/useTimer.ts`

```typescript
export function useTimer(onExpire: () => void) {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;  // evitar stale closure

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
  }, []);

  const start = useCallback((seconds: number) => {
    stop();
    setTimeRemaining(seconds);
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          stop();
          onExpireRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000) as unknown as number;
  }, [stop]);

  const syncWithServer = useCallback((remaining: number) => {
    setTimeRemaining(prev => Math.abs(prev - remaining) > 1 ? remaining : prev);
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { timeRemaining, isRunning, start, stop, syncWithServer };
}
```

---

### 8.4 `hooks/useGame.ts`

**Reducer**: gestiona `GameState` amb les accions de `GameAction`.

**Subscripcions** (dins `useEffect([socket])`):
```
socket.on("room:created",      → dispatch ROOM_CREATED)
socket.on("room:player-joined",→ dispatch PLAYERS_UPDATED)
socket.on("room:player-left",  → dispatch PLAYERS_UPDATED)
socket.on("room:error",        → dispatch ERROR)
socket.on("game:round-start",  → dispatch ROUND_START + timer.start)
socket.on("game:answer-result",→ dispatch ANSWER_RESULT; timeout 1.5s → FLASH_CLEAR)
socket.on("game:round-end",    → dispatch ROUND_END)
socket.on("game:timer-tick",   → dispatch TIMER_TICK + timer.syncWithServer)
socket.on("game:end",          → dispatch GAME_END)
```
Sempre `return () => socket.off(...)` per netejar.

**Neteja de flashCountryId**: `setTimeout(() => dispatch({ type: "FLASH_CLEAR" }), 1500)` quan arriba `ANSWER_RESULT` amb `flashCountryId`.

**Neteja de `answerFeedback`**: `setTimeout(() => dispatch({ type: "FEEDBACK_CLEAR" }), 2000)` quan arriba `ANSWER_RESULT`.

---

### 8.5 `components/Globe/Globe.tsx`

**Carrega GeoJSON** via `fetch("/geody/data/ne_110m_admin_0_countries.geojson")` dins un `useEffect` (o `useLoader` de drei).

**Estructura Three.js**:
```tsx
<Canvas camera={{ position: [0, 0, 2.5], fov: 45 }}>
  <ambientLight intensity={0.6} />
  <directionalLight position={[5, 5, 5]} intensity={0.8} />
  <mesh>  {/* esfera base */}
    <sphereGeometry args={[1, 64, 64]} />
    <meshPhongMaterial color="#1a6b8a" />
  </mesh>
  {features.map(f => (
    <GlobeCountry
      key={f.properties.ADM0_A3}
      feature={f}
      isTarget={f.properties.ADM0_A3 === targetCountryId}
      isFlashing={f.properties.ADM0_A3 === flashCountryId}
      onFlashComplete={onFlashComplete}
    />
  ))}
  <OrbitControls enablePan={false} minDistance={1.5} maxDistance={4} />
</Canvas>
```

**Auto-rotació de càmera**: quan `targetCountryId` canvia i `autoRotate=true`:
- Convertir `(lat, lng)` del país a vector 3D sobre l'esfera
- Interpolar `camera.position` amb `useFrame` durant ~60 frames (1s a 60fps)
- Usar `THREE.Spherical` per a la interpolació

**Conversió coordenades → vector 3D**:
```typescript
function latLngToVector3(lat: number, lng: number, radius = 1.02): THREE.Vector3 {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta)
  );
}
```

**GeoJSON → geometria 3D**: per a cada Feature del GeoJSON, convertir les coordenades `[lng, lat]` a vectors 3D i crear un `THREE.BufferGeometry`. Considerar usar `d3-geo` per a la projecció o implementar la conversió manualment.

---

### 8.6 `components/Globe/GlobeCountry.tsx`

**Materials**:
```
normal:   color #8fbc8f, emissive #000, roughness 0.8
target:   color #ffd700, emissive #ffa500 (pulsant via useFrame)
flashing: color #ff4444, emissive #ff0000
```

**Animació target** (useFrame):
```
emissiveIntensity = 0.3 + 0.3 * Math.sin(clock.elapsedTime * 3)
```

**Animació flaix** (useRef + useEffect):
```
isFlashing → setea timer 1500ms → crida onFlashComplete
```

---

## 9. Catàleg d'events Socket.IO (definitiu)

### 9.1 Client → Servidor

| Event | Payload | Qui l'emet | Condicions |
|-------|---------|-----------|-----------|
| `room:create` | `{ locale: string }` | Amfitrió | Qualsevol moment |
| `room:join` | `{ code: string, playerName: string }` | Alumne | Des de PlayerLobby |
| `room:config` | `Partial<GameConfig>` | Amfitrió | state="lobby" |
| `room:kick` | `{ playerId: string }` | Amfitrió | state="lobby" |
| `game:start` | (buit) | Amfitrió | state="lobby", ≥1 jugador |
| `game:answer` | `{ text: string, roundIndex: number }` | Alumne | state="playing" |
| `game:next-round` | (buit) | Amfitrió | state="round-results" |
| `game:reveal-answer` | (buit) | Amfitrió | state="playing" |

### 9.2 Servidor → Client

| Event | Payload | Destinatari | Quan |
|-------|---------|------------|------|
| `room:created` | `{ code, qrUrl }` | Socket creador | Sala creada |
| `room:player-joined` | `{ player, players[] }` | Tota la sala | Nou jugador |
| `room:player-left` | `{ playerId }` | Tota la sala | Desconnexió |
| `room:error` | `{ message, code }` | Socket | Error |
| `game:round-start` | `{ round, timePerRound }` | Tota la sala | Ronda nova |
| `game:answer-result` | `{ playerId, isCorrect, flashCountryId?, points, totalScore }` | Tota la sala | Resposta processada |
| `game:round-end` | `{ correctAnswer, targetCountryId, scores[] }` | Tota la sala | Ronda acabada |
| `game:end` | `{ result: GameResult }` | Tota la sala | Partida acabada |
| `game:timer-tick` | `{ remaining: number }` | Tota la sala | Cada segon |

### 9.3 Flux de sala (lifecycle)

```
CONNEXIÓ
  └─ "room:create" → "room:created"
  └─ "room:join"   → "room:player-joined" (broadcast)

LOBBY
  └─ "room:config" → [no event de resposta; amfitrió actualitza localment]
  └─ "game:start"  → "game:round-start" (ronda 0)

RONDA ACTIVA (per a cada ronda)
  └─ "game:timer-tick" cada segon
  └─ "game:answer"     → "game:answer-result"
       ├─ Mode fastest + encert → "game:round-end"
       └─ Mode kahoot + tots han enviat → "game:round-end"
  └─ Timer = 0 → "game:round-end" (automàtic)
  └─ "game:reveal-answer" → "game:round-end" (manual)

RESULTATS RONDA
  └─ "game:next-round"
       ├─ Si queden rondes → "game:round-start"
       └─ Si última ronda  → "game:end"

FINAL
  └─ "game:end" → pantalla de resultats finals
```

---

## 10. Pla de tests

### 10.1 Tests de servidor (`server/vitest.config.ts`)

**`ScoreCalculator.test.ts`**
```typescript
describe("ScoreCalculator.calculate", () => {
  it("retorna pointsPerCorrect quan timeRemaining=0 i no perfecte")
  it("retorna pointsPerCorrect + speedBonusMax quan timeRemaining=timePerRound i no perfecte")
  it("afegeix spellingBonus quan isSpellingPerfect=true")
  it("suma els tres bonuses quan tot és perfecte i màxim de temps")
  it("mai retorna menys de pointsPerCorrect")
})
```

**`RoundGenerator.test.ts`**
```typescript
describe("RoundGenerator.generateRounds", () => {
  it("genera el nombre correcte de rondes")
  it("no repeteix cap país")
  it("filtra per continent correctament")
  it("mode 'countries': totes les rondes són 'country'")
  it("mode 'capitals': totes les rondes són 'capital'")
  it("mode 'both': alterna country/capital")
  it("llança error si no hi ha prou països")
  it("correctAnswer correspon al locale actiu")
})
```

**`AnswerValidator.test.ts`**
```typescript
describe("AnswerValidator.normalize", () => {
  it("elimina accents: França → franca")
  it("lowercase: ESPANYA → espanya")
  it("trim i espais: '  Nova Zelanda  ' → 'nova zelanda'")
  it("cedilla: Algèria → algeria")
})

describe("AnswerValidator.validate", () => {
  it("correcta: resposta normalitzada coincideix")
  it("perfecta: coincideix exactament amb majúscules i accents")
  it("incorrecta: retorna isCorrect=false")
  it("incorrecta però país real: retorna flashCountryId")
  it("variant acceptada: retorna isCorrect=true")
})
```

**`RoomManager.test.ts`**
```typescript
describe("RoomManager", () => {
  it("createRoom: genera codi de 6 chars")
  it("createRoom: no genera codis duplicats")
  it("addPlayer: llança ROOM_FULL quan hi ha 40 jugadors")
  it("addPlayer: llança GAME_IN_PROGRESS si la partida ha començat")
  it("removePlayer: marca connected=false en comptes d'eliminar")
  it("cleanupInactiveRooms: elimina sales amb TTL expirat")
})
```

**`GameEngine.test.ts`**
```typescript
describe("GameEngine.processAnswer (mode fastest)", () => {
  it("retorna isCorrect=true i punts per resposta correcta")
  it("ignora una segona resposta correcta del mateix jugador")
  it("retorna flashCountryId per resposta incorrecta però real")
})

describe("GameEngine.endRound (mode kahoot)", () => {
  it("calcula punts per a tots els jugadors")
  it("jugadors sense resposta reben 0 punts")
})
```

**`handlers.test.ts`** (tests d'integració amb socket.io mock)
```typescript
it("room:create → emet room:created amb codi de 6 chars")
it("room:join → emet room:player-joined a tots els membres")
it("room:join → emet room:error si sala no trobada")
it("game:answer (fastest) → emet game:round-end si isCorrect")
```

### 10.2 Tests de client

**`normalize.test.ts`**
```typescript
it("idèntic a la implementació del servidor")
it("França → franca")
it("  Nova Zelanda  → nova zelanda")
```

**`useTimer.test.ts`** (renderHook)
```typescript
it("compta enrere fins a 0 i crida onExpire")
it("syncWithServer corregeix si difereix en >1s")
it("stop atura el compte enrere")
```

**`AnswerInput.test.ts`** (Testing Library)
```typescript
it("envia la resposta en prémer Enter")
it("esborra el camp després d'enviar")
it("mostra feedback 'correct' quan feedback='correct'")
it("botó desactivat quan disabled=true")
```

**`Timer.test.ts`**
```typescript
it("mostra els segons correctes")
it("afegeix classe 'urgent' quan urgent=true")
it("barra de progrés té l'amplada correcta")
```

**`Scoreboard.test.ts`**
```typescript
it("ordena jugadors per puntuació descendent")
it("ressalta el jugador actual")
it("mostra màxim 10 jugadors")
```

---

## 11. Build i desplegament

### 11.1 Desenvolupament local

```bash
# Instal·lar dependències
npm install

# Iniciar dev (client port 5173, servidor port 3001)
npm run dev

# Crear fitxer .env al directori server/
# (copiar de server/.env.example)
```

**Prerequisit**: fitxer GeoJSON a `client/public/data/ne_110m_admin_0_countries.geojson`
Descarregar de: https://github.com/nvkelso/natural-earth-vector (110m admin 0)
El camp `ADM0_A3` ha de coincidir amb els ISO3 de `countries.json`.

### 11.2 Build de producció

```bash
npm run build
# → client/dist/  (estàtic per a GitHub Pages)
# → server/dist/  (JS compilat per a Render)
```

### 11.3 GitHub Pages (client)

- `vite.config.ts` té `base: "/geody/"` → tots els assets es serviran sota `/geody/`
- GitHub Actions (a configurar): en push a `main`, fer build i pujar `client/dist/` a la branca `gh-pages`
- `VITE_SERVER_URL` s'ha de definir com a variable d'entorn del workflow

### 11.4 Render (servidor)

- Start command: `node dist/index.js`
- Build command: `npm run build --workspace=server`
- Variable `CLIENT_ORIGIN`: URL de GitHub Pages (ex: `https://usuari.github.io/geody`)
- Variable `PORT`: assignada automàticament per Render (no hardcodejar)

---

## 12. Fitxers de dades (format de referència)

### `server/src/data/countries.json`
Array JSON. Cada entrada:
```json
{ "id": "ESP", "iso2": "ES", "continent": "europe", "coordinates": { "lat": 40.0, "lng": -4.0 } }
```
Continents vàlids: `"africa"`, `"asia"`, `"europe"`, `"north-america"`, `"south-america"`, `"oceania"`.

### `server/src/data/locales/ca.json`
Objecte JSON indexat per ISO3:
```json
{
  "ESP": { "country": "Espanya", "capital": "Madrid", "acceptedVariants": [] },
  "FRA": { "country": "França", "capital": "París", "acceptedVariants": ["Paris"] }
}
```
- `country`: nom oficial en català (font: IEC)
- `capital`: nom oficial en català
- `acceptedVariants`: variants tolerades (sense accentuació o noms alternatius)

---

## 13. Checklist d'implementació (ordre suggerit)

```
Fase 1 — Infraestructura base
  [ ] normalize() (client + servidor, idèntiques)
  [ ] ScoreCalculator.calculate()
  [ ] RoundGenerator.generateRounds() + selectCountries()
  [ ] AnswerValidator.validate() + normalize() + findCountryByAnswer()
  [ ] CountryLoader (totes les funcions)
  [ ] Room (tots els mètodes)
  [ ] RoomManager (totes les funcions)

Fase 2 — Servidor Socket.IO
  [ ] GameEngine (tots els mètodes)
  [ ] handlers.ts (tots els handlers)
  [ ] Timer al servidor (startRoomTimer + endCurrentRound)
  [ ] index.ts complet

Fase 3 — Client hooks
  [ ] useSocket
  [ ] useTimer
  [ ] useGame (reducer + subscripcions)

Fase 4 — Globus 3D
  [ ] Globe.tsx (carrega GeoJSON, renderitza esfera + countries)
  [ ] GlobeCountry.tsx (mesh + animacions)
  [ ] Auto-rotació de càmera

Fase 5 — Components UI
  [ ] Button, Input (components de base)
  [ ] Timer, AnswerInput, Scoreboard
  [ ] GameScreen (layout complet)
  [ ] RoundResults, FinalResults, Podium
  [ ] HomeScreen, HostLobby, PlayerLobby
  [ ] App.tsx (routing)

Fase 6 — Tests
  [ ] Tests de servidor (ScoreCalculator, RoundGenerator, AnswerValidator, RoomManager, GameEngine)
  [ ] Tests de client (normalize, useTimer, AnswerInput, Timer, Scoreboard)

Fase 7 — Polish
  [ ] Responsivitat mòbil
  [ ] Animació Podium (seqüència 3r → 2n → 1r)
  [ ] Indicador de connexió perduda
  [ ] QR code al HostLobby
  [ ] GeoJSON a client/public/data/
```
