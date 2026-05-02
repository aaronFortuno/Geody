import type { Server, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  RoomCreatePayload,
  RoomJoinPayload,
  RoomConfigPayload,
  GameStartPayload,
  GameAnswerPayload,
  RoomKickPayload,
  RoomErrorPayload,
  CountryData,
} from "@geody/shared";
import type { Room } from "../rooms/Room.js";
import type { RoomManager } from "../rooms/RoomManager.js";
import type { GameEngine } from "../game/GameEngine.js";
import type { CountryLoader } from "../data/CountryLoader.js";

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type SocketData = { roomCode?: string };
type RoomWithRuntime = Room & { _timerInterval?: ReturnType<typeof setInterval> };

const CLIENT_ORIGIN = process.env["CLIENT_ORIGIN"] ?? "http://localhost:5173";

function getSocketData(socket: TypedSocket): SocketData {
  return socket.data as SocketData;
}

function getRoomCode(socket: TypedSocket): string | undefined {
  return getSocketData(socket).roomCode;
}

function setRoomCode(socket: TypedSocket, roomCode: string | undefined): void {
  getSocketData(socket).roomCode = roomCode;
}

function emitRoomError(
  socket: TypedSocket,
  message: string,
  code: RoomErrorPayload["code"]
): void {
  socket.emit("room:error", { message, code });
}

function handleError(socket: TypedSocket, error: unknown): void {
  if (error instanceof Error) {
    if (error.message === "ROOM_NOT_FOUND") {
      emitRoomError(socket, "Sala no trobada", "ROOM_NOT_FOUND");
      return;
    }
    if (error.message === "ROOM_FULL") {
      emitRoomError(socket, "La sala està plena", "ROOM_FULL");
      return;
    }
    if (error.message === "GAME_IN_PROGRESS") {
      emitRoomError(socket, "La partida ja ha començat", "GAME_IN_PROGRESS");
      return;
    }
    if (error.message === "NOT_HOST") {
      emitRoomError(socket, "Només l'amfitrió pot fer aquesta acció", "NOT_HOST");
      return;
    }
    if (error.message === "INVALID_NAME") {
      emitRoomError(socket, "Nom de jugador no vàlid", "INVALID_NAME");
      return;
    }
  }
  console.error(error);
  socket.emit("room:error", {
    message: "Error intern",
    code: "INTERNAL" as RoomErrorPayload["code"],
  });
}

function endCurrentRound(
  room: RoomWithRuntime,
  io: TypedServer,
  _roomManager: RoomManager,
  gameEngine: GameEngine,
  countries: CountryData[]
): void {
  const round = room.getCurrentRound();
  if (!round || room.state !== "playing" || round.endedAt) {
    return;
  }
  if (room._timerInterval) {
    clearInterval(room._timerInterval);
    room._timerInterval = undefined;
  }
  const result = gameEngine.endRound(room, countries);
  io.to(room.code).emit("game:round-end", {
    correctAnswer: result.correctAnswer,
    targetCountryId: result.targetCountryId,
    scores: result.scores,
  });
}

function startRoomTimer(
  room: RoomWithRuntime,
  io: TypedServer,
  roomManager: RoomManager,
  gameEngine: GameEngine,
  countries: CountryData[]
): void {
  if (room._timerInterval) {
    clearInterval(room._timerInterval);
    room._timerInterval = undefined;
  }
  let remaining = room.config.timePerRound;
  room._timerInterval = setInterval(() => {
    remaining -= 1;
    io.to(room.code).emit("game:timer-tick", { remaining });
    if (remaining <= 0) {
      if (room._timerInterval) {
        clearInterval(room._timerInterval);
        room._timerInterval = undefined;
      }
      if (room.state === "playing") {
        endCurrentRound(room, io, roomManager, gameEngine, countries);
      }
    }
  }, 1000);
}

/**
 * Registra tots els handlers de Socket.IO per a una connexió nova.
 * Cridat un cop per cada socket.on("connection", ...).
 */
export function registerHandlers(
  socket: TypedSocket,
  io: TypedServer,
  roomManager: RoomManager,
  gameEngine: GameEngine,
  countryLoader: CountryLoader
): void {
  socket.on("room:create",       (p) => handleRoomCreate(socket, io, roomManager, p));
  socket.on("room:join",         (p) => handleRoomJoin(socket, io, roomManager, p));
  socket.on("room:config",       (p) => handleRoomConfig(socket, io, roomManager, p));
  socket.on("room:kick",         (p) => handleRoomKick(socket, io, roomManager, p));
  socket.on("game:start",        (p) => handleGameStart(socket, io, roomManager, gameEngine, countryLoader, p));
  socket.on("game:answer",       (p) => handleGameAnswer(socket, io, roomManager, gameEngine, countryLoader, p));
  socket.on("game:next-round",   ()  => handleGameNextRound(socket, io, roomManager, gameEngine, countryLoader));
  socket.on("game:reveal-answer",()  => handleGameRevealAnswer(socket, io, roomManager, gameEngine, countryLoader));
  socket.on("game:return-lobby", ()  => handleGameReturnToLobby(socket, io, roomManager));
  socket.on("disconnect",        ()  => handleDisconnect(socket, io, roomManager));
}

// ─── Handlers individuals (exportats per a tests) ────────────────────────────

/**
 * Crea una nova sala.
 * Emet "room:created" al socket creador amb el codi i el QR URL.
 * Afegeix l'amfitrió com a Player(isHost=true).
 * Subscriu el socket a la room de Socket.IO: socket.join(code).
 */
export function handleRoomCreate(
  socket: TypedSocket,
  io: TypedServer,
  roomManager: RoomManager,
  payload: RoomCreatePayload
): void {
  try {
    const room = roomManager.createRoom(socket.id, payload.locale);
    setRoomCode(socket, room.code);
    void io;
    socket.join(room.code);
    room.touch();
    const qrUrl = `${CLIENT_ORIGIN}?code=${room.code}`;
    socket.emit("room:created", { code: room.code, qrUrl });
  } catch (error) {
    handleError(socket, error);
  }
}

/**
 * Uneix un alumne a una sala existent.
 * Valida: sala existeix, no plena, partida no iniciada, nom no buit (max 20 chars).
 * Emet "room:player-joined" a TOTS els de la sala (inclòs el nou jugador).
 * Emet "room:error" al socket si algun error.
 */
export function handleRoomJoin(
  socket: TypedSocket,
  io: TypedServer,
  roomManager: RoomManager,
  payload: RoomJoinPayload
): void {
  try {
    const code = payload.code.trim().toUpperCase();
    const playerName = payload.playerName.trim();
    if (playerName.length === 0 || playerName.length > 20) {
      throw new Error("INVALID_NAME");
    }

    const room = roomManager.getRoom(code);
    if (!room) {
      throw new Error("ROOM_NOT_FOUND");
    }

    const reconnectingPlayer = Array.from(room.players.values()).find(
      (player) => !player.connected && !player.isHost && player.name === playerName
    );

    if (reconnectingPlayer) {
      roomManager.reconnectPlayer(code, reconnectingPlayer.id, socket.id);
    } else {
      if (room.isFull()) {
        throw new Error("ROOM_FULL");
      }
      if (room.state !== "lobby") {
        throw new Error("GAME_IN_PROGRESS");
      }
      roomManager.addPlayer(code, { id: socket.id, name: playerName });
    }

    const updatedRoom = roomManager.getRoom(code);
    if (!updatedRoom) {
      throw new Error("ROOM_NOT_FOUND");
    }
    const joinedPlayer = updatedRoom.players.get(socket.id);
    if (!joinedPlayer) {
      throw new Error("ROOM_NOT_FOUND");
    }

    setRoomCode(socket, code);
    socket.join(code);
    updatedRoom.touch();
    io.to(code).emit("room:player-joined", {
      player: joinedPlayer,
      players: updatedRoom.getLeaderboard(),
    });
  } catch (error) {
    handleError(socket, error);
  }
}

/**
 * L'amfitrió actualitza la configuració de la partida.
 * Valida que el socket sigui l'amfitrió de la sala.
 * Emet "room:config" actualitzat a tota la sala.
 */
export function handleRoomConfig(
  socket: TypedSocket,
  io: TypedServer,
  roomManager: RoomManager,
  payload: RoomConfigPayload
): void {
  try {
    const code = getRoomCode(socket);
    if (!code) {
      throw new Error("ROOM_NOT_FOUND");
    }
    const room = roomManager.getRoom(code);
    if (!room) {
      throw new Error("ROOM_NOT_FOUND");
    }
    if (room.hostId !== socket.id) {
      throw new Error("NOT_HOST");
    }
    roomManager.setConfig(code, payload);
    room.touch();
    void io;
  } catch (error) {
    handleError(socket, error);
  }
}

/**
 * L'amfitrió expulsa un jugador.
 * Valida que el socket sigui l'amfitrió.
 * Desconnecta el socket del jugador i emet "room:player-left" a la sala.
 */
export function handleRoomKick(
  socket: TypedSocket,
  io: TypedServer,
  roomManager: RoomManager,
  payload: RoomKickPayload
): void {
  try {
    const code = getRoomCode(socket);
    if (!code) {
      throw new Error("ROOM_NOT_FOUND");
    }
    const room = roomManager.getRoom(code);
    if (!room) {
      throw new Error("ROOM_NOT_FOUND");
    }
    if (room.hostId !== socket.id) {
      throw new Error("NOT_HOST");
    }
    if (payload.playerId === room.hostId) {
      return;
    }

    room.players.delete(payload.playerId);
    room.touch();
    io.to(code).emit("room:player-left", { playerId: payload.playerId });

    const playerSocket = io.sockets.sockets.get(payload.playerId) as TypedSocket | undefined;
    if (playerSocket) {
      setRoomCode(playerSocket, undefined);
      playerSocket.leave(code);
      playerSocket.disconnect(true);
    }
  } catch (error) {
    handleError(socket, error);
  }
}

/**
 * L'amfitrió inicia la partida.
 * Valida: és amfitrió, ≥ 1 jugador connectat, estat "lobby".
 * Crida gameEngine.startGame → genera rondes.
 * Emet "game:round-start" (ronda 0) a tota la sala.
 * Inicia el timer al servidor (setInterval per game:timer-tick cada segon).
 */
export function handleGameStart(
  socket: TypedSocket,
  io: TypedServer,
  roomManager: RoomManager,
  gameEngine: GameEngine,
  countryLoader: CountryLoader,
  payload?: GameStartPayload
): void {
  try {
    const code = getRoomCode(socket);
    if (!code) {
      throw new Error("ROOM_NOT_FOUND");
    }
    const room = roomManager.getRoom(code);
    if (!room) {
      throw new Error("ROOM_NOT_FOUND");
    }
    if (room.hostId !== socket.id) {
      throw new Error("NOT_HOST");
    }
    if (room.state !== "lobby") {
      throw new Error("GAME_IN_PROGRESS");
    }
    if (payload?.config) {
      roomManager.setConfig(code, payload.config);
    }

    const connectedPlayers = Array.from(room.players.values()).filter(
      (player) => player.connected && !player.isHost
    );
    if (connectedPlayers.length < 1) {
      emitRoomError(socket, "Cal almenys un jugador connectat per iniciar", "GAME_IN_PROGRESS");
      return;
    }

    const countries = countryLoader.getCountriesForLocale(room.config.locale);
    gameEngine.startGame(room, countries);
    gameEngine.startRound(room);
    const round = room.getCurrentRound();
    if (!round) {
      throw new Error("Round not found");
    }
    room.touch();

    io.to(code).emit("game:round-start", {
      round: {
        index: round.index,
        type: round.type,
        targetCountryId: round.targetCountryId,
        correctAnswer: round.correctAnswer,
      },
      timePerRound: room.config.timePerRound,
    });

    startRoomTimer(room as RoomWithRuntime, io, roomManager, gameEngine, countries);
  } catch (error) {
    handleError(socket, error);
  }
}

/**
 * L'amfitrió avanç a la següent ronda.
 * Valida: amfitrió, estat "round-results".
 * Si queden rondes: crida startRound, emet "game:round-start".
 * Si no: crida endGame, emet "game:end".
 */
export function handleGameNextRound(
  socket: TypedSocket,
  io: TypedServer,
  roomManager: RoomManager,
  gameEngine: GameEngine,
  countryLoader: CountryLoader
): void {
  try {
    const code = getRoomCode(socket);
    if (!code) {
      throw new Error("ROOM_NOT_FOUND");
    }
    const room = roomManager.getRoom(code);
    if (!room) {
      throw new Error("ROOM_NOT_FOUND");
    }
    if (room.hostId !== socket.id) {
      throw new Error("NOT_HOST");
    }
    if (room.state !== "round-results") {
      throw new Error("GAME_IN_PROGRESS");
    }

    room.currentRound += 1;
    if (room.currentRound < room.rounds.length) {
      room.state = "playing";
      gameEngine.startRound(room);
      const round = room.getCurrentRound();
      if (!round) {
        throw new Error("Round not found");
      }
      room.touch();
      io.to(code).emit("game:round-start", {
        round: {
          index: round.index,
          type: round.type,
          targetCountryId: round.targetCountryId,
          correctAnswer: round.correctAnswer,
        },
        timePerRound: room.config.timePerRound,
      });
      const countries = countryLoader.getCountriesForLocale(room.config.locale);
      startRoomTimer(room as RoomWithRuntime, io, roomManager, gameEngine, countries);
      return;
    }

    room.currentRound = room.rounds.length - 1;
    const result = gameEngine.endGame(room);
    room.touch();
    io.to(code).emit("game:end", { result });
  } catch (error) {
    handleError(socket, error);
  }
}

/**
 * L'amfitrió força la revelació de la resposta (temps esgotat o manual).
 * Crida endRound si la ronda segueix activa.
 * Emet "game:round-end".
 */
export function handleGameRevealAnswer(
  socket: TypedSocket,
  io: TypedServer,
  roomManager: RoomManager,
  gameEngine: GameEngine,
  countryLoader: CountryLoader
): void {
  try {
    const code = getRoomCode(socket);
    if (!code) {
      throw new Error("ROOM_NOT_FOUND");
    }
    const room = roomManager.getRoom(code);
    if (!room) {
      throw new Error("ROOM_NOT_FOUND");
    }
    if (room.hostId !== socket.id) {
      throw new Error("NOT_HOST");
    }
    if (room.state !== "playing") {
      return;
    }
    const countries = countryLoader.getCountriesForLocale(room.config.locale);
    endCurrentRound(room as RoomWithRuntime, io, roomManager, gameEngine, countries);
    room.touch();
  } catch (error) {
    handleError(socket, error);
  }
}

/**
 * L'amfitrió finalitza/abandona la partida actual i torna tota la sala al lobby.
 * Manté jugadors i configuració, reinicia puntuacions i rondes.
 */
export function handleGameReturnToLobby(
  socket: TypedSocket,
  io: TypedServer,
  roomManager: RoomManager
): void {
  try {
    const code = getRoomCode(socket);
    if (!code) {
      throw new Error("ROOM_NOT_FOUND");
    }
    const room = roomManager.getRoom(code) as RoomWithRuntime | undefined;
    if (!room) {
      throw new Error("ROOM_NOT_FOUND");
    }
    if (room.hostId !== socket.id) {
      throw new Error("NOT_HOST");
    }

    if (room._timerInterval) {
      clearInterval(room._timerInterval);
      room._timerInterval = undefined;
    }

    room.state = "lobby";
    room.currentRound = 0;
    room.rounds = [];
    for (const player of room.players.values()) {
      player.score = 0;
    }
    room.touch();

    io.to(code).emit("game:returned-lobby", {
      players: room.getLeaderboard(),
      config: room.config,
    });
  } catch (error) {
    handleError(socket, error);
  }
}

/**
 * Gestiona la desconnexió d'un socket.
 * Cerca a quina sala pertany (si n'hi ha) i crida roomManager.removePlayer.
 * Emet "room:player-left" a la resta.
 * Si era l'amfitrió, emet un avís a la sala i inicia el TTL de reconnexió.
 */
export function handleDisconnect(
  socket: TypedSocket,
  io: TypedServer,
  roomManager: RoomManager
): void {
  try {
    const code = getRoomCode(socket);
    if (!code) {
      return;
    }
    const room = roomManager.getRoom(code);
    if (!room) {
      return;
    }
    roomManager.removePlayer(code, socket.id);
    room.touch();
    io.to(code).emit("room:player-left", { playerId: socket.id });
  } catch (error) {
    handleError(socket, error);
  }
}

/**
 * Un jugador envia una resposta.
 * Valida: partida activa, roundIndex coincideix amb l'actual, no fora de temps.
 * Crida gameEngine.processAnswer.
 * Emet "game:answer-result" a tota la sala (tots veuen el flaix).
 *
 * Mode "fastest": si isCorrect → crida endRound → emet "game:round-end".
 * Mode "kahoot": si allPlayersAnswered → crida endRound → emet "game:round-end".
 */
export function handleGameAnswer(
  socket: TypedSocket,
  io: TypedServer,
  roomManager: RoomManager,
  gameEngine: GameEngine,
  countryLoader: CountryLoader,
  payload: GameAnswerPayload
): void {
  try {
    const code = getRoomCode(socket);
    if (!code) {
      return;
    }
    const room = roomManager.getRoom(code);
    if (!room) {
      return;
    }
    if (room.state !== "playing") {
      return;
    }
    if (payload.roundIndex !== room.currentRound) {
      return;
    }

    const round = room.getCurrentRound();
    if (!round || round.endedAt || round.startedAt === undefined) {
      return;
    }

    const now = Date.now();
    if (now - round.startedAt > room.config.timePerRound * 1000) {
      return;
    }

    const countries = countryLoader.getCountriesForLocale(room.config.locale);
    const result = gameEngine.processAnswer(room, socket.id, payload.text, now, countries);
    room.touch();
    const flashCountry = result.flashCountryId
      ? countries.find((country) => country.id === result.flashCountryId)
      : undefined;
    const guessedLabel =
      flashCountry?.names[room.config.locale]?.[round.type === "capital" ? "capital" : "country"];
    const showGuessLabel =
      Boolean(guessedLabel) &&
      (room.config.guessLabelUntilRoundEnd || room.config.guessLabelSeconds > 0);
    const flashLabel = showGuessLabel ? guessedLabel : undefined;
    const flashLabelDurationMs = room.config.guessLabelUntilRoundEnd
      ? undefined
      : Math.max(0, Math.floor(room.config.guessLabelSeconds * 1000));

    io.to(code).emit("game:answer-result", {
      playerId: socket.id,
      isCorrect: result.isCorrect,
      flashCountryId: result.flashCountryId,
      flashLabel,
      flashLabelDurationMs,
      flashLabelUntilRoundEnd: room.config.guessLabelUntilRoundEnd,
      points: result.points,
      totalScore: result.totalScore,
    });

    if (result.isCorrect && room.config.gameType === "fastest") {
      endCurrentRound(room as RoomWithRuntime, io, roomManager, gameEngine, countries);
    }
    if (room.config.gameType === "kahoot" && room.allPlayersAnswered()) {
      endCurrentRound(room as RoomWithRuntime, io, roomManager, gameEngine, countries);
    }
  } catch (error) {
    handleError(socket, error);
  }
}

/**
 * L'amfitrió avança a la ronda següent.
 * Valida: és amfitrió, estat "round-results".
 * Si queden rondes: emet "game:round-start" amb la ronda següent.
 * Si última ronda: crida endGame → emet "game:end".
 */
