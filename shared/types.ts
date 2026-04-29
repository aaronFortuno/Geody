// ─── Tipus geogràfics ────────────────────────────────────────────────────────

export type Continent =
  | "africa"
  | "asia"
  | "europe"
  | "north-america"
  | "south-america"
  | "oceania";

export interface CountryData {
  id: string;       // ISO 3166-1 alpha-3 (ex: "ESP")
  iso2: string;     // ISO 3166-1 alpha-2 (ex: "ES")
  continent: Continent;
  coordinates: { lat: number; lng: number }; // centroide
  names: {
    [locale: string]: {
      country: string;
      capital: string;
      acceptedVariants?: string[];
    };
  };
}

// ─── Sala ────────────────────────────────────────────────────────────────────

export type RoomState = "lobby" | "playing" | "round-results" | "final-results";

export interface Player {
  id: string;       // socket ID
  name: string;
  avatar?: string;  // color hex o emoji
  score: number;
  isHost: boolean;
  connected: boolean;
}

// ─── Configuració del joc ────────────────────────────────────────────────────

export interface GameConfig {
  locale: string;
  mode: "countries" | "capitals" | "both";
  continents: Continent[];
  totalRounds: number;           // 5–50
  pointsPerCorrect: number;      // default 100
  speedBonusMax: number;         // default 50
  spellingBonus: number;         // default 25
  timePerRound: number;          // 10–120, default 30
  gameType: "fastest" | "kahoot";
  allowAnswerChange: boolean;    // només mode "kahoot"
  autoRotateGlobe: boolean;
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  locale: "ca",
  mode: "countries",
  continents: ["europe"],
  totalRounds: 10,
  pointsPerCorrect: 100,
  speedBonusMax: 50,
  spellingBonus: 25,
  timePerRound: 30,
  gameType: "fastest",
  allowAnswerChange: true,
  autoRotateGlobe: true,
};

// ─── Rondes i respostes ──────────────────────────────────────────────────────

export interface PlayerAnswer {
  playerId: string;
  text: string;
  timestamp: number;      // ms epoch
  isCorrect: boolean;
  isSpellingPerfect: boolean;
  pointsEarned: number;
  attempts: number;       // rellevant en mode "fastest"
}

export interface Round {
  index: number;
  type: "country" | "capital";
  targetCountryId: string;       // ISO3
  correctAnswer: string;         // nom oficial en el locale actiu
  startedAt?: number;
  endedAt?: number;
  answers: Record<string, PlayerAnswer>;
}

// ─── Resultats ───────────────────────────────────────────────────────────────

export interface RoundScoreEntry {
  playerId: string;
  name: string;
  pointsEarned: number;
  totalScore: number;
  isCorrect: boolean;
}

export interface RoundResult {
  roundIndex: number;
  correctAnswer: string;
  targetCountryId: string;
  scores: RoundScoreEntry[];
}

export interface PlayerStats {
  playerId: string;
  name: string;
  totalScore: number;
  correctAnswers: number;
  perfectSpellings: number;
  averageResponseTimeMs: number;
  bestStreak: number;
}

export interface GameResult {
  finalScores: PlayerStats[];
  podium: [PlayerStats, PlayerStats | null, PlayerStats | null];
}

// ─── Payloads Socket.IO: Client → Servidor ───────────────────────────────────

export interface RoomCreatePayload {
  locale: string;
}

export interface RoomJoinPayload {
  code: string;
  playerName: string;
}

export type RoomConfigPayload = Partial<GameConfig>;

export interface GameAnswerPayload {
  text: string;
  roundIndex: number;
}

export interface RoomKickPayload {
  playerId: string;
}

// ─── Payloads Socket.IO: Servidor → Client ───────────────────────────────────

export interface RoomCreatedPayload {
  code: string;
  qrUrl: string;
}

export interface RoomPlayerJoinedPayload {
  player: Player;
  players: Player[];
}

export interface RoomPlayerLeftPayload {
  playerId: string;
}

export interface GameRoundStartPayload {
  round: Omit<Round, "answers" | "startedAt" | "endedAt">;
  timePerRound: number;
}

export interface GameAnswerResultPayload {
  playerId: string;
  isCorrect: boolean;
  flashCountryId?: string;
  points: number;
  totalScore: number;
}

export interface GameRoundEndPayload {
  correctAnswer: string;
  targetCountryId: string;
  scores: RoundScoreEntry[];
}

export interface GameEndPayload {
  result: GameResult;
}

export interface GameTimerTickPayload {
  remaining: number;
}

export interface RoomErrorPayload {
  message: string;
  code: "ROOM_NOT_FOUND" | "ROOM_FULL" | "GAME_IN_PROGRESS" | "NOT_HOST" | "INVALID_NAME";
}

// ─── Catàleg d'events (per documentació i tipat fort) ────────────────────────

export interface ClientToServerEvents {
  "room:create": (payload: RoomCreatePayload) => void;
  "room:join": (payload: RoomJoinPayload) => void;
  "room:config": (payload: RoomConfigPayload) => void;
  "room:kick": (payload: RoomKickPayload) => void;
  "game:start": () => void;
  "game:answer": (payload: GameAnswerPayload) => void;
  "game:next-round": () => void;
  "game:reveal-answer": () => void;
}

export interface ServerToClientEvents {
  "room:created": (payload: RoomCreatedPayload) => void;
  "room:player-joined": (payload: RoomPlayerJoinedPayload) => void;
  "room:player-left": (payload: RoomPlayerLeftPayload) => void;
  "room:error": (payload: RoomErrorPayload) => void;
  "game:round-start": (payload: GameRoundStartPayload) => void;
  "game:answer-result": (payload: GameAnswerResultPayload) => void;
  "game:round-end": (payload: GameRoundEndPayload) => void;
  "game:end": (payload: GameEndPayload) => void;
  "game:timer-tick": (payload: GameTimerTickPayload) => void;
}
