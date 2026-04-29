# Geody - Especificacions del Projecte

## 1. Visio General

**Geody** es un joc multijugador en temps real per a aules, centrat en geografia mundial (paisos i capitals). Funciona com un "Kahoot geografic" on el professor crea una sala, els alumnes s'hi connecten amb un codi curt, i juguen endevinant paisos o capitals sobre un globus terraqui 3D interactiu.

---

## 2. Arquitectura

### 2.1 Stack Tecnologic

| Capa | Tecnologia | Notes |
|------|-----------|-------|
| Frontend | React 18+, TypeScript, Vite | SPA desplegada a GitHub Pages |
| Globus 3D | Three.js via `react-three-fiber` + `drei` | Globe amb GeoJSON |
| Comunicacio temps real | Socket.IO client | Events bidireccionals |
| Backend | Node.js + Express + Socket.IO server | Desplegat a Render |
| Dades geografiques | Natural Earth GeoJSON (110m) | Fronteres de paisos |
| Dades de paisos/capitals | JSON propi amb i18n | Fonts oficials per idioma |

### 2.2 Infraestructura

```
[GitHub Pages]          [Render]
   Frontend  <---WSS--->  Backend (Node.js)
   (React)               (Socket.IO + Express)
                          Sales en memoria
                          (sense BD)
```

- **Frontend**: SPA estatica a GitHub Pages.
- **Backend**: Servidor Node.js a Render. Zero persistencia: totes les sales son efimeres i viuen nomes en memoria.
- **Comunicacio**: WebSocket (Socket.IO) amb fallback a long-polling.

### 2.3 Estructura del Monorepo

```
geody/
├── client/                  # Frontend React
│   ├── public/
│   │   └── data/            # GeoJSON, datasets paisos/capitals
│   ├── src/
│   │   ├── components/
│   │   │   ├── Globe/       # Globus 3D (Three.js)
│   │   │   ├── Game/        # Logica de joc (rondes, respostes)
│   │   │   ├── Lobby/       # Creacio/unio a sales
│   │   │   ├── Admin/       # Panell del professor
│   │   │   └── UI/          # Components reutilitzables
│   │   ├── hooks/           # Custom hooks (useSocket, useGame...)
│   │   ├── i18n/            # Fitxers de traduccio de la UI
│   │   ├── types/           # TypeScript types compartits
│   │   ├── utils/           # Helpers, normalitzacio text
│   │   └── App.tsx
│   └── package.json
├── server/                  # Backend Node.js
│   ├── src/
│   │   ├── rooms/           # Gestio de sales
│   │   ├── game/            # Motor de joc, puntuacio
│   │   ├── data/            # Datasets paisos/capitals per idioma
│   │   ├── validation/      # Validacio de respostes
│   │   ├── socket/          # Handlers Socket.IO
│   │   └── index.ts
│   └── package.json
├── shared/                  # Types i constants compartides
│   └── types.ts
├── SPEC.md
├── CLAUDE.md
└── package.json             # Workspaces root
```

---

## 3. Model de Dades

### 3.1 Pais/Capital (Dataset)

```typescript
interface CountryData {
  id: string;              // Codi ISO 3166-1 alpha-3 (ex: "ESP", "FRA")
  iso2: string;            // Codi ISO alpha-2 (ex: "ES", "FR")
  continent: Continent;
  coordinates: {           // Centroide per posicionar camera
    lat: number;
    lng: number;
  };
  names: {
    [locale: string]: {    // "ca", "es", "en", "fr"...
      country: string;     // Nom oficial del pais
      capital: string;     // Nom oficial de la capital
      acceptedVariants?: string[]; // Variants acceptades (opcional)
    };
  };
}

type Continent =
  | "africa"
  | "asia"
  | "europe"
  | "north-america"
  | "south-america"
  | "oceania";
// Nota: L'Antartida no s'inclou al joc.
```

### 3.2 Sala (Room)

```typescript
interface Room {
  code: string;            // Codi curt (6 chars alfanumeric majuscules)
  hostId: string;          // Socket ID del professor
  players: Map<string, Player>;
  config: GameConfig;
  state: RoomState;        // "lobby" | "playing" | "round-results" | "final-results"
  currentRound: number;
  rounds: Round[];         // Pre-generades al iniciar
  createdAt: number;
}

interface Player {
  id: string;              // Socket ID
  name: string;
  avatar?: string;         // Color o emoji senzill
  score: number;
  isHost: boolean;
}
```

### 3.3 Configuracio del Joc

```typescript
interface GameConfig {
  locale: string;                    // "ca" per defecte
  mode: "countries" | "capitals" | "both";
  // Si mode es "both", cada ronda alterna o es random
  continents: Continent[];           // Seleccio multiple, minim 1
  totalRounds: number;               // Nombre de rondes (5-50)

  // Puntuacio
  pointsPerCorrect: number;          // Punts base per encert (per defecte: 100)
  speedBonusMax: number;             // Bonus maxim per velocitat (per defecte: 50)
  spellingBonus: number;             // Bonus per escriptura perfecta (per defecte: 25)

  // Temps
  timePerRound: number;              // Segons per ronda (10-120, defecte: 30)

  // Mode de joc
  gameType: "fastest" | "kahoot";
  // fastest: envies respostes fins encertar, primer que encerta guanya
  // kahoot: una resposta per jugador (o canviable), resolucio al final

  // Opcions addicionals
  allowAnswerChange: boolean;        // Nomes aplica a mode "kahoot" (defecte: true)
  autoRotateGlobe: boolean;          // Rotar globus automaticament al pais (defecte: true)
}
```

### 3.4 Ronda

```typescript
interface Round {
  index: number;
  type: "country" | "capital";       // Que s'ha d'endevinar
  targetCountryId: string;           // ISO code del pais objectiu
  correctAnswer: string;             // Resposta correcta en el locale actiu
  startedAt?: number;
  endedAt?: number;
  answers: Map<string, PlayerAnswer>;
}

interface PlayerAnswer {
  playerId: string;
  text: string;
  timestamp: number;
  isCorrect: boolean;
  isSpellingPerfect: boolean;        // Majuscules, accents, etc. perfectes
  pointsEarned: number;
  attempts: number;                  // Nomes rellevant en mode "fastest"
}
```

---

## 4. Flux del Joc

### 4.1 Creacio de Sala i Lobby

1. El professor accedeix a la web i prem "Crear Sala".
2. El servidor genera un codi de 6 caracters (majuscules + digits, sense ambiguitats: exclou O/0, I/1/L).
3. El professor configura la partida (veure `GameConfig`).
4. Els alumnes accedeixen a la web, introdueixen el codi i el seu nom.
5. El professor veu la llista de jugadors connectats en temps real.
6. Quan esta preparat, el professor prem "Iniciar Partida".

### 4.2 Desenvolupament d'una Ronda

#### Mode "Fastest" (Mode Rapid)

```
Professor prem "Seguent" (o automatic)
        │
        ▼
   [Globus destaca un pais]
   [Timer comenca]
        │
        ▼
   Alumnes escriuen respostes
        │
        ├─ Resposta incorrecta pero pais existent:
        │   → Flaix al globus a la ubicacio del pais escrit (visible per TOTS)
        │   → L'alumne pot tornar a intentar-ho
        │
        ├─ Resposta correcta:
        │   → Notificacio a TOTS: "[Nom] ha encertat!"
        │   → Es mostra resposta correcta + punts
        │   → Ronda acaba (o continua per la resta, configurable futur)
        │
        └─ Temps esgotat:
            → Es mostra la resposta correcta
            → Ningu puntua
        │
        ▼
   [Pantalla de resultats de ronda]
   [Classificacio actualitzada]
        │
        ▼
   Professor prem "Seguent" → proxima ronda
```

#### Mode "Kahoot"

```
Professor prem "Seguent" (o automatic)
        │
        ▼
   [Globus destaca un pais]
   [Timer comenca]
        │
        ▼
   Alumnes escriuen UNA resposta
   (canviable si allowAnswerChange=true)
        │
        ├─ Quan TOTS han enviat:
        │   → Resolucio immediata
        │
        └─ Quan s'acaba el temps:
            → Resolucio amb les respostes enviades
        │
        ▼
   [Pantalla de resolucio]
   - Resposta correcta revelada
   - Flaix al globus per respostes incorrectes (paisos existents)
   - Puntuacio de cada jugador per la ronda
   - Classificacio acumulada
        │
        ▼
   Professor prem "Seguent" → proxima ronda
```

### 4.3 Puntuacio

```
punts_ronda = 0

SI resposta_correcta:
    punts_ronda += pointsPerCorrect

    // Bonus velocitat: proporcional al temps restant
    temps_restant_ratio = temps_restant / timePerRound
    punts_ronda += floor(speedBonusMax * temps_restant_ratio)

    // Bonus escriptura perfecta
    SI resposta_enviada === resposta_oficial (case-sensitive, accents, etc.):
        punts_ronda += spellingBonus
```

**Definicio d'"escriptura perfecta"**: La resposta enviada coincideix exactament (caracter a caracter) amb el nom oficial segons la font de l'idioma actiu. Aixo inclou:
- Majuscules/minuscules correctes
- Accents i diacritics correctes
- Espais i guionets correctes

**Validacio de resposta correcta** (no perfecta): Es normalitza la resposta (lowercase, sense accents, sense espais extres) i es compara amb la versio normalitzada del nom oficial + variants acceptades.

### 4.4 Final de Partida

Despres de l'ultima ronda:
1. Pantalla de resultats finals amb classificacio completa.
2. Podium animat (1r, 2n, 3r).
3. Estadistiques: encerts, ratxa, velocitat mitjana.
4. Boto "Tornar al Lobby" per jugar una altra partida amb la mateixa sala.

---

## 5. Globus 3D

### 5.1 Tecnologia

- `react-three-fiber` com a renderer React per Three.js.
- `@react-three/drei` per controls de camera (OrbitControls), helpers, etc.
- GeoJSON de Natural Earth (110m) per fronteres de paisos.

### 5.2 Visualitzacio

- **Base**: Esfera amb textura d'aigua (color blau solid o gradient senzill).
- **Paisos**: Poligons extrusionats lleugerament des de la superficie, amb color base (verd/beix terrestre).
- **Pais objectiu**: Ressaltat amb un color viu (groc/taronja pulsant) + contorn brillant.
- **Flaix de resposta incorrecta**: Quan un jugador escriu un pais existent pero incorrecte, aquell pais fa un flaix breu (vermell, ~1.5s) visible per tots els jugadors.
- **Capital**: Punt/marcador sobre la posicio de la capital quan el mode es "capitals".

### 5.3 Interaccio

- **Rotacio**: Clic + arrossegar per rotar el globus.
- **Zoom**: Scroll/pinch per zoom in/out (amb limits).
- **Auto-rotacio**: Si `autoRotateGlobe=true`, el globus s'anima suaument fins centrar el pais objectiu a cada ronda (animacio de ~1-2s).
- **Si `autoRotateGlobe=false`**: Els alumnes han de buscar el pais pel globus manualment (mes dificultat, mes divertit per nivells avancats).

### 5.4 Responsivitat

- El globus ocupa la major part de la pantalla.
- En pantalles petites (mobil), el camp de resposta es un input fixat a la part inferior.
- En pantalles grans (projector del professor), el globus es mes prominent i la classificacio es visible al costat.

---

## 6. Interficie d'Usuari (UI)

### 6.1 Principis de Disseny

- **Paleta de colors**: Tons terrosos i aquatics (blau mar, verd terra, beix sorra) amb accents vius per feedback.
- **Tipografia**: Sans-serif neta i llegible. Mida gran per projectors.
- **Estil**: Modern, net, lleugerament ludic pero no infantil (ha de funcionar per a totes les edats).
- **Animacions**: Subtils i funcionals (transicions suaus, feedback visual clar). No excessives.
- **Accessibilitat**: Contrast suficient, mides tocables en mobil (min 44px), feedback no nomes per color.

### 6.2 Pantalles

#### Pantalla d'Inici
- Logo "Geody" + globus decoratiu de fons (animat suaument)
- Dos botons prominents: "Crear Sala" | "Unir-se a una Sala"
- Selector d'idioma de la UI (futur, per ara nomes catala)

#### Lobby del Professor (Host)
- Codi de sala gran i visible (per projectar)
- Tambe un QR code que porta a la URL amb el codi ja omplert
- Llista de jugadors connectats (amb el seu nom)
- Panell de configuracio de la partida (GameConfig)
- Boto "Iniciar Partida" (desactivat si < 1 jugador)

#### Lobby de l'Alumne
- Input per introduir el codi de sala
- Input per introduir el seu nom
- Estat: "Esperant que el professor iniciï la partida..."
- Veu la llista dels altres jugadors connectats

#### Pantalla de Joc - Professor
- Globus 3D gran (80% de pantalla)
- Timer visible a dalt
- Numero de ronda (ex: "Ronda 3/15")
- Classificacio lateral (top 5 + scroll)
- NO te camp de resposta
- Boto "Mostrar Resposta" (per si ningu l'endevina)
- Boto "Seguent Ronda" (apareix despres de resolucio)

#### Pantalla de Joc - Alumne
- Globus 3D (60-70% de pantalla)
- Camp de resposta fixat a baix (input + boto enviar)
- Timer visible
- La seva puntuacio actual
- Feedback immediat: "Incorrecte" (amb flaix al globus) o "Correcte! +X punts"

#### Pantalla de Resultats de Ronda
- Resposta correcta mostrada clarament
- Llista de jugadors amb punts guanyats a la ronda
- Classificacio acumulada
- Animacio breu del pais correcte al globus

#### Pantalla de Resultats Finals
- Podium animat (1r, 2n, 3r)
- Classificacio completa
- Estadistiques per jugador
- Boto "Tornar al Lobby" / "Nova Partida"

### 6.3 Responsivitat

| Dispositiu | Layout |
|-----------|--------|
| Mobil (< 768px) | Globus a dalt, input a baix fixat, classificacio en overlay/modal |
| Tablet (768-1024px) | Globus centrat, input a baix, classificacio lateral plegable |
| Desktop/Projector (> 1024px) | Globus gran central, classificacio lateral sempre visible |

---

## 7. Comunicacio Client-Servidor (Socket.IO Events)

### 7.1 Client → Servidor

| Event | Payload | Descripcio |
|-------|---------|-----------|
| `room:create` | `{ locale }` | Professor crea sala |
| `room:join` | `{ code, playerName }` | Alumne s'uneix |
| `room:config` | `GameConfig` | Professor actualitza config |
| `game:start` | `{}` | Professor inicia partida |
| `game:answer` | `{ text, roundIndex }` | Alumne envia resposta |
| `game:next-round` | `{}` | Professor avanca ronda |
| `game:reveal-answer` | `{}` | Professor mostra resposta |
| `room:kick` | `{ playerId }` | Professor expulsa jugador |

### 7.2 Servidor → Client

| Event | Payload | Descripcio |
|-------|---------|-----------|
| `room:created` | `{ code, qrUrl }` | Sala creada amb exit |
| `room:player-joined` | `Player` | Nou jugador a la sala |
| `room:player-left` | `{ playerId }` | Jugador desconnectat |
| `game:round-start` | `{ round, targetCountryId, type, timePerRound }` | Nova ronda |
| `game:answer-result` | `{ playerId, isCorrect, flashCountryId?, points }` | Resultat d'una resposta |
| `game:round-end` | `{ correctAnswer, scores[], roundResults[] }` | Fi de ronda |
| `game:end` | `{ finalScores[], podium, stats }` | Fi de partida |
| `game:timer-tick` | `{ remaining }` | Sincronitzacio de timer |
| `room:error` | `{ message }` | Error (sala plena, codi incorrecte, etc.) |

### 7.3 Notes de Sincronitzacio

- El **timer es autoritatiu al servidor**. El client mostra un timer local pero es sincronitza periodicamente.
- La **validacio de respostes es fa al servidor**. Mai al client (anti-trampes).
- Les **rondes es pre-generen** al servidor quan comenca la partida (seleccio aleatoria de paisos dels continents escollits).

---

## 8. Internacionalitzacio (i18n)

### 8.1 Dos Nivells d'i18n

1. **UI de l'aplicacio**: Textos de botons, instruccions, missatges. Fitxers de traduccio (JSON) al client.
2. **Dades del joc**: Noms de paisos i capitals. Dataset al servidor, indexat per locale.

### 8.2 Idiomes de Dades (Prioritat)

| Prioritat | Idioma | Codi | Font oficial |
|-----------|--------|------|-------------|
| 1 (MVP) | Catala | `ca` | IEC (Institut d'Estudis Catalans) |
| 2 | Castella | `es` | RAE (Real Academia Espanola) |
| 3 | Angles | `en` | UNGEGN / BGN |
| 4+ | Altres | ... | Autoritat linguistica pertinent |

### 8.3 Estructura de Dades per Idioma

```
server/src/data/
├── countries.json          # Dades base (ISO, coordenades, continent)
├── locales/
│   ├── ca.json             # { "ESP": { "country": "Espanya", "capital": "Madrid" }, ... }
│   ├── es.json             # { "ESP": { "country": "Espana", "capital": "Madrid" }, ... }
│   └── en.json             # { "ESP": { "country": "Spain", "capital": "Madrid" }, ... }
```

### 8.4 Validacio

La validacio de respostes es fa en dos passos:

```
1. Normalitzacio: lowercase, trim, eliminar espais dobles
   → Comparar amb versio normalitzada del nom oficial + variants
   → Si coincideix: CORRECTE (no perfecte)

2. Comparacio exacta: resposta original vs nom oficial exacte
   → Si coincideix: PERFECTE (bonus punts)
```

Funcio de normalitzacio:
```typescript
function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Eliminar accents
    .replace(/\s+/g, " ");           // Normalitzar espais
}
```

---

## 9. Gestio d'Errors i Casos Limit

- **Desconnexio del professor**: La partida es pausa. Si no es reconnecta en 60s, la sala es destrueix.
- **Desconnexio d'un alumne**: Es marca com "desconnectat". Pot reconnectar-se amb el mateix nom al mateix codi. La seva puntuacio es manté.
- **Sala buida**: Auto-destruccio despres de 5 minuts sense activitat.
- **Codi de sala duplicat**: El servidor reintenta fins generar un codi unic.
- **Respostes fora de temps**: Ignorades pel servidor.
- **Intents de trampa**: Validacio al servidor, rate-limiting de respostes (max 1 per segon en mode rapid).

---

## 10. Rendiment i Limits

- **Max jugadors per sala**: 40 (una aula tipica).
- **Max sales simultanies**: Limitat per la memoria de Render (estimar ~50KB per sala).
- **GeoJSON**: Utilitzar resolucio 110m (lleuger, ~800KB) per rendiment al navegador.
- **Three.js**: Objectiu de 60fps en dispositius moderns, 30fps acceptable en mobils antics.
- **Mida del bundle**: Objectiu < 2MB total (inclos GeoJSON).

---

## 11. Seguretat

- **CORS**: Nomes permetre origen de GitHub Pages.
- **Rate limiting**: Limitar creacio de sales (max 5/minut per IP).
- **Validacio d'inputs**: Sanititzar noms de jugadors i respostes.
- **Sense autenticacio**: No cal login. El professor es simplement qui crea la sala.
- **Codis de sala**: Alfanumerics, 6 caracters, expiren amb la sala.

---

## 12. Fases de Desenvolupament

### Fase 1: Infraestructura base
- Setup monorepo (Vite + Express + Socket.IO)
- Connexio WebSocket client-servidor
- Creacio i unio a sales (lobby funcional)
- Desplegament basic (GH Pages + Render)

### Fase 2: Globus 3D
- Renderitzat del globus amb GeoJSON
- Ressaltat de paisos
- Controls interactius (rotar, zoom)
- Auto-rotacio animada

### Fase 3: Motor de joc
- Generacio de rondes
- Validacio de respostes (servidor)
- Sistema de puntuacio
- Timer sincronitzat
- Mode "fastest" complet
- Mode "kahoot" complet

### Fase 4: UI completa
- Totes les pantalles (lobby, joc, resultats)
- Responsivitat
- Animacions i feedback visual
- Flaix de paisos incorrectes al globus

### Fase 5: Dades i i18n
- Dataset complet de paisos/capitals en catala (IEC)
- Estructura i18n preparada
- QR code per unir-se

### Fase 6: Polish
- Podium animat
- Estadistiques finals
- Optimitzacions de rendiment
- Testing
