import type { GameConfig, Player, RoomState, Round } from "@geody/shared";
import { DEFAULT_GAME_CONFIG } from "@geody/shared";

export class Room {
  readonly code: string;
  hostId: string;
  players: Map<string, Player>;
  config: GameConfig;
  state: RoomState;
  currentRound: number;
  rounds: Round[];
  readonly createdAt: number;
  lastActivityAt: number;
  hostDisconnectedAt?: number;

  static readonly MAX_PLAYERS = 40;

  constructor(code: string, hostId: string, locale: string) {
    this.code = code;
    this.hostId = hostId;
    this.players = new Map();
    this.config = { ...DEFAULT_GAME_CONFIG, locale };
    this.state = "lobby";
    this.currentRound = 0;
    this.rounds = [];
    this.createdAt = Date.now();
    this.lastActivityAt = Date.now();
  }

  /** Retorna el jugador amfitrió, o undefined si no hi és. */
  getHost(): Player | undefined {
    return this.players.get(this.hostId);
  }

  /** Retorna true si la sala ha arribat al màxim de jugadors. */
  isFull(): boolean {
    return this.players.size >= Room.MAX_PLAYERS;
  }

  /**
   * Retorna els jugadors ordenats per puntuació descendent.
   * Inclou jugadors desconnectats (la seva puntuació es conserva).
   */
  getLeaderboard(): Player[] {
    return Array.from(this.players.values()).sort((a, b) => b.score - a.score);
  }

  /** Retorna la ronda actual o undefined si no hi ha partida activa. */
  getCurrentRound(): Round | undefined {
    return this.rounds[this.currentRound];
  }

  /**
   * Comprova si tots els jugadors connectats han enviat resposta a la ronda actual.
   * Rellevant per al mode "kahoot" (resolució anticipada).
   */
  allPlayersAnswered(): boolean {
    const round = this.getCurrentRound();
    if (!round) {
      return false;
    }
    const connectedPlayers = Array.from(this.players.values()).filter(
      (player) => player.connected && !player.isHost
    );
    return connectedPlayers.every((player) => Boolean(round.answers[player.id]));
  }

  /** Actualitza lastActivityAt al moment actual. */
  touch(): void {
    this.lastActivityAt = Date.now();
  }
}
