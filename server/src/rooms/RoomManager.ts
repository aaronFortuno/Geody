import type { GameConfig, Player } from "@geody/shared";
import { Room } from "./Room.js";

export class RoomManager {
  private readonly rooms: Map<string, Room> = new Map();

  private static readonly CLEANUP_INTERVAL_MS = 60_000;
  private static readonly ROOM_IDLE_TTL_MS = 5 * 60_000;
  private static readonly HOST_RECONNECT_TTL_MS = 60_000;

  // Alfanumèric majúscules excloent caràcters ambigus (O, 0, I, 1, L)
  private static readonly CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  private static readonly CODE_LENGTH = 6;

  constructor() {
    setInterval(() => this.cleanupInactiveRooms(), RoomManager.CLEANUP_INTERVAL_MS);
  }

  /**
   * Crea una nova sala i la registra.
   * @param hostId   Socket ID de l'amfitrió
   * @param locale   Locale del joc (ex: "ca")
   * @returns        La sala creada
   */
  createRoom(hostId: string, locale: string): Room {
    const code = this.generateCode();
    const room = new Room(code, hostId, locale);
    room.players.set(hostId, {
      id: hostId,
      name: "Professor",
      avatar: "🎓",
      score: 0,
      isHost: true,
      connected: true,
    });
    this.rooms.set(code, room);
    return room;
  }

  /**
   * Obté una sala pel seu codi.
   * @returns La sala, o undefined si no existeix
   */
  getRoom(code: string): Room | undefined {
    return this.rooms.get(code);
  }

  /**
   * Elimina una sala i allibera recursos.
   * Cridat en: fi de partida, TTL exhaurit, amfitrió desconnectat massa temps.
   */
  deleteRoom(code: string): void {
    this.rooms.delete(code);
  }

  /**
   * Afegeix un jugador a una sala existent.
   * @throws Error si sala plena, no trobada, o partida en curs
   */
  addPlayer(
    code: string,
    player: Omit<Player, "score" | "isHost" | "connected">
  ): void {
    const room = this.rooms.get(code);
    if (!room) {
      throw new Error("ROOM_NOT_FOUND");
    }
    if (room.isFull()) {
      throw new Error("ROOM_FULL");
    }
    if (room.state !== "lobby") {
      throw new Error("GAME_IN_PROGRESS");
    }
    room.players.set(player.id, {
      ...player,
      score: 0,
      isHost: false,
      connected: true,
    });
    room.touch();
  }

  /**
   * Elimina un jugador (per desconnexió).
   * Si el jugador és l'amfitrió, inicia el comptador HOST_RECONNECT_TTL.
   */
  removePlayer(code: string, playerId: string): void {
    const room = this.rooms.get(code);
    if (!room) {
      return;
    }
    if (playerId === room.hostId) {
      room.hostDisconnectedAt = Date.now();
    }
    const player = room.players.get(playerId);
    if (player) {
      player.connected = false;
    }
    room.touch();
  }

  /**
   * Marca un jugador com a reconnectat.
   * Reemplaça l'antic socket ID pel nou.
   */
  reconnectPlayer(code: string, oldPlayerId: string, newPlayerId: string): void {
    const room = this.rooms.get(code);
    if (!room) {
      return;
    }
    const oldPlayer = room.players.get(oldPlayerId);
    if (!oldPlayer) {
      return;
    }
    room.players.delete(oldPlayerId);
    room.players.set(newPlayerId, {
      id: newPlayerId,
      name: oldPlayer.name,
      avatar: oldPlayer.avatar,
      score: oldPlayer.score,
      isHost: oldPlayer.isHost,
      connected: true,
    });
    if (room.hostId === oldPlayerId) {
      room.hostId = newPlayerId;
      room.hostDisconnectedAt = undefined;
    }
    room.touch();
  }

  /**
   * Actualitza la configuració d'una sala.
   * Només es pot cridar mentre la sala és en estat "lobby".
   * @throws Error si la sala no existeix o no és en "lobby"
   */
  setConfig(code: string, config: Partial<GameConfig>): void {
    const room = this.rooms.get(code);
    if (!room) {
      throw new Error("ROOM_NOT_FOUND");
    }
    if (room.state !== "lobby") {
      throw new Error("GAME_IN_PROGRESS");
    }
    Object.assign(room.config, config);
    room.touch();
  }

  /** Retorna totes les sales actives (per a diagnòstic). */
  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  /**
   * Destrueix les sales inactives:
   * - Sales en "lobby" sense activitat durant ROOM_IDLE_TTL_MS
   * - Sales amb l'amfitrió desconnectat durant més de HOST_RECONNECT_TTL_MS
   */
  private cleanupInactiveRooms(): void {
    const now = Date.now();
    for (const [code, room] of this.rooms.entries()) {
      if (
        room.hostDisconnectedAt !== undefined &&
        now - room.hostDisconnectedAt > RoomManager.HOST_RECONNECT_TTL_MS
      ) {
        this.deleteRoom(code);
        continue;
      }
      if (
        room.state === "lobby" &&
        now - room.lastActivityAt > RoomManager.ROOM_IDLE_TTL_MS
      ) {
        this.deleteRoom(code);
      }
    }
  }

  /**
   * Genera un codi de sala únic de 6 caràcters.
   * Utilitza CODE_CHARS (sense caràcters ambigus).
   * Reintenta fins trobar un codi no existent.
   */
  private generateCode(): string {
    let code = "";
    do {
      code = "";
      for (let i = 0; i < RoomManager.CODE_LENGTH; i += 1) {
        const index = Math.floor(Math.random() * RoomManager.CODE_CHARS.length);
        code += RoomManager.CODE_CHARS[index] ?? "";
      }
    } while (this.rooms.has(code));
    return code;
  }
}
