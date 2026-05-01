import { useCallback, useEffect, useReducer, useRef } from "react";
import type { Socket } from "socket.io-client";
import { DEFAULT_GAME_CONFIG } from "@geody/shared";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  GameConfig,
  Player,
  Round,
  RoundResult,
  GameResult,
} from "@geody/shared";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// ─── Estat del joc ───────────────────────────────────────────────────────────

export type GamePhase =
  | "idle"
  | "lobby"
  | "playing"
  | "round-results"
  | "final-results";

export interface GameState {
  phase: GamePhase;
  roomCode: string | null;
  qrUrl: string | null;
  players: Player[];
  config: GameConfig | null;
  currentRound: (Omit<Round, "answers"> & { answers?: never }) | null;
  roundResult: RoundResult | null;
  gameResult: GameResult | null;
  myPlayerId: string | null;
  myScore: number;
  timeRemaining: number;
  /** ISO3 del pais a fer flaix al globus. Es neteja automàticament a 1.5s. */
  flashCountryId: string | null;
  flashLabels: Array<{
    id: number;
    countryId: string;
    label: string;
    byPlayerId: string;
    durationMs: number;
    untilRoundEnd: boolean;
  }>;
  /** Feedback immediat per a l'alumne: null, "correct" o "incorrect" */
  answerFeedback: "correct" | "incorrect" | null;
  /** Punts guanyats a l'últim encert (per mostrar animació) */
  lastPointsEarned: number;
  isHost: boolean;
  error: string | null;
}

// ─── Accions del reducer ─────────────────────────────────────────────────────

type GameAction =
  | { type: "ROOM_CREATED"; code: string; qrUrl: string; playerId: string }
  | { type: "ROOM_JOINED"; code: string; players: Player[]; playerId: string }
  | { type: "RETURNED_LOBBY"; players: Player[]; config: GameConfig }
  | { type: "PLAYERS_UPDATED"; players: Player[] }
  | { type: "CONFIG_UPDATED"; config: GameConfig }
  | { type: "ROUND_START"; round: Omit<Round, "answers">; timePerRound: number }
  | {
      type: "ANSWER_RESULT";
      playerId: string;
      isCorrect: boolean;
      flashCountryId?: string;
      flashLabel?: string;
      flashLabelId?: number;
      flashLabelDurationMs?: number;
      flashLabelUntilRoundEnd?: boolean;
      points: number;
      totalScore: number;
    }
  | { type: "ROUND_END"; result: RoundResult }
  | { type: "TIMER_TICK"; remaining: number }
  | { type: "GAME_END"; result: GameResult }
  | { type: "FLASH_CLEAR" }
  | { type: "FLASH_LABEL_REMOVE"; id: number }
  | { type: "FLASH_LABEL_CLEAR_ALL" }
  | { type: "FEEDBACK_CLEAR" }
  | { type: "ERROR"; message: string }
  | { type: "RESET" };

const initialState: GameState = {
  phase: "idle",
  roomCode: null,
  qrUrl: null,
  players: [],
  config: null,
  currentRound: null,
  roundResult: null,
  gameResult: null,
  myPlayerId: null,
  myScore: 0,
  timeRemaining: 0,
  flashCountryId: null,
  flashLabels: [],
  answerFeedback: null,
  lastPointsEarned: 0,
  isHost: false,
  error: null,
};

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "ROOM_CREATED":
      return {
        ...state,
        phase: "lobby",
        roomCode: action.code,
        qrUrl: action.qrUrl,
        myPlayerId: action.playerId,
        isHost: true,
        error: null,
      };
    case "ROOM_JOINED": {
      const me = action.players.find((player) => player.id === action.playerId);
      return {
        ...state,
        phase: "lobby",
        roomCode: action.code,
        players: action.players,
        myPlayerId: action.playerId,
        myScore: me?.score ?? state.myScore,
        isHost: false,
        error: null,
      };
    }
    case "RETURNED_LOBBY": {
      const me = state.myPlayerId
        ? action.players.find((player) => player.id === state.myPlayerId)
        : undefined;
      return {
        ...state,
        phase: "lobby",
        players: action.players,
        config: action.config,
        currentRound: null,
        roundResult: null,
        gameResult: null,
        timeRemaining: 0,
        flashCountryId: null,
        flashLabels: [],
        answerFeedback: null,
        lastPointsEarned: 0,
        myScore: me?.score ?? 0,
        error: null,
      };
    }
    case "PLAYERS_UPDATED": {
      const me = state.myPlayerId
        ? action.players.find((player) => player.id === state.myPlayerId)
        : undefined;
      return {
        ...state,
        players: action.players,
        myScore: me?.score ?? state.myScore,
      };
    }
    case "CONFIG_UPDATED":
      return { ...state, config: action.config };
    case "ROUND_START":
      return {
        ...state,
        phase: "playing",
        currentRound: action.round,
        roundResult: null,
        timeRemaining: action.timePerRound,
        answerFeedback: null,
        lastPointsEarned: 0,
        flashCountryId: null,
        flashLabels: [],
        error: null,
      };
    case "ANSWER_RESULT":
      {
      const labels = [...state.flashLabels];
      if (action.flashLabel && action.flashCountryId && action.flashLabelId !== undefined) {
        labels.push({
          id: action.flashLabelId,
          countryId: action.flashCountryId,
          label: action.flashLabel,
          byPlayerId: action.playerId,
          durationMs: action.flashLabelDurationMs ?? 0,
          untilRoundEnd: action.flashLabelUntilRoundEnd ?? false,
        });
      }
      return {
        ...state,
        players: state.players.map((player) =>
          player.id === action.playerId ? { ...player, score: action.totalScore } : player
        ),
        flashCountryId: action.flashCountryId ?? null,
        flashLabels: labels,
        answerFeedback: action.isCorrect ? "correct" : "incorrect",
        lastPointsEarned: action.points,
        myScore:
          state.myPlayerId === action.playerId ? action.totalScore || state.myScore : state.myScore,
      };
      }
    case "ROUND_END":
      return {
        ...state,
        phase: "round-results",
        roundResult: action.result,
        timeRemaining: 0,
        answerFeedback: null,
        flashLabels: [],
      };
    case "TIMER_TICK":
      return { ...state, timeRemaining: action.remaining };
    case "GAME_END":
      return {
        ...state,
        phase: "final-results",
        gameResult: action.result,
        currentRound: null,
        roundResult: null,
      };
    case "FLASH_CLEAR":
      return { ...state, flashCountryId: null };
    case "FLASH_LABEL_REMOVE":
      return { ...state, flashLabels: state.flashLabels.filter((entry) => entry.id !== action.id) };
    case "FLASH_LABEL_CLEAR_ALL":
      return { ...state, flashLabels: [] };
    case "FEEDBACK_CLEAR":
      return { ...state, answerFeedback: null, lastPointsEarned: 0 };
    case "ERROR":
      return { ...state, error: action.message };
    case "RESET":
      return { ...initialState };
    default:
      return state;
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Hook central que gestiona tot l'estat del joc i les subscripcions Socket.IO.
 *
 * Subscriu als events: room:created, room:player-joined, room:player-left,
 * room:error, game:round-start, game:answer-result, game:round-end,
 * game:end, game:timer-tick.
 *
 * Les accions emeten events al servidor via socket.emit.
 *
 * @param socket  Connexió Socket.IO activa (o null si no connectat)
 * @param isHost  True si l'usuari actual és l'amfitrió
 */
export function useGame(
  socket: AppSocket | null,
  isHost: boolean
): {
  state: GameState;
  actions: {
    /** Crea una nova sala (amfitrió). */
    createRoom: (locale: string) => void;
    /** Uneix un alumne a una sala. */
    joinRoom: (code: string, name: string) => void;
    /** Actualitza la configuració (amfitrió, en "lobby"). */
    updateConfig: (config: Partial<GameConfig>) => void;
    /** Inicia la partida (amfitrió). */
    startGame: () => void;
    /** Envia la resposta de l'alumne. */
    submitAnswer: (text: string) => void;
    /** Avança a la ronda següent (amfitrió). */
    nextRound: () => void;
    /** Revela la resposta (amfitrió). */
    revealAnswer: () => void;
    /** Expulsa un jugador (amfitrió). */
    kickPlayer: (playerId: string) => void;
    /** Torna al lobby per a una nova partida. */
    returnToLobby: () => void;
  };
} {
  const pendingJoinCodeRef = useRef<string | null>(null);
  const flashLabelSeqRef = useRef(1);
  const flashLabelTimeoutsRef = useRef<Map<number, number>>(new Map());
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    isHost,
  });

  useEffect(() => {
    if (!socket) return undefined;

    const handleRoomCreated: ServerToClientEvents["room:created"] = (payload) => {
      dispatch({
        type: "ROOM_CREATED",
        code: payload.code,
        qrUrl: payload.qrUrl,
        playerId: socket.id ?? "",
      });
    };
    const handlePlayerJoined: ServerToClientEvents["room:player-joined"] = (payload) => {
      const joinedMe = payload.player.id === socket.id;
      dispatch(
        joinedMe
          ? {
              type: "ROOM_JOINED",
              code: state.roomCode ?? pendingJoinCodeRef.current ?? "",
              players: payload.players,
              playerId: payload.player.id,
            }
          : { type: "PLAYERS_UPDATED", players: payload.players }
      );
    };
    const handlePlayerLeft: ServerToClientEvents["room:player-left"] = (payload) => {
      dispatch({
        type: "PLAYERS_UPDATED",
        players: state.players.map((player) =>
          player.id === payload.playerId ? { ...player, connected: false } : player
        ),
      });
    };
    const handleError: ServerToClientEvents["room:error"] = (payload) => {
      dispatch({ type: "ERROR", message: payload.message });
    };
    const handleRoundStart: ServerToClientEvents["game:round-start"] = (payload) => {
      for (const timeoutId of flashLabelTimeoutsRef.current.values()) {
        window.clearTimeout(timeoutId);
      }
      flashLabelTimeoutsRef.current.clear();
      dispatch({
        type: "ROUND_START",
        round: payload.round,
        timePerRound: payload.timePerRound,
      });
    };
    const handleAnswerResult: ServerToClientEvents["game:answer-result"] = (payload) => {
      const flashLabelId = payload.flashLabel ? flashLabelSeqRef.current++ : undefined;
      dispatch({
        type: "ANSWER_RESULT",
        playerId: payload.playerId,
        isCorrect: payload.isCorrect,
        flashCountryId: payload.flashCountryId,
        flashLabel: payload.flashLabel,
        flashLabelId,
        flashLabelDurationMs: payload.flashLabelDurationMs,
        flashLabelUntilRoundEnd: payload.flashLabelUntilRoundEnd,
        points: payload.points,
        totalScore: payload.totalScore,
      });
      if (payload.flashCountryId) {
        window.setTimeout(() => dispatch({ type: "FLASH_CLEAR" }), 1500);
      }
      if (payload.flashLabel && flashLabelId !== undefined) {
        if (!payload.flashLabelUntilRoundEnd) {
          const duration = Math.max(0, payload.flashLabelDurationMs ?? 0);
          if (duration > 0) {
            const timeoutId = window.setTimeout(() => {
              dispatch({ type: "FLASH_LABEL_REMOVE", id: flashLabelId });
              flashLabelTimeoutsRef.current.delete(flashLabelId);
            }, duration);
            flashLabelTimeoutsRef.current.set(flashLabelId, timeoutId);
          }
        }
      }
      window.setTimeout(() => dispatch({ type: "FEEDBACK_CLEAR" }), 2000);
    };
    const handleRoundEnd: ServerToClientEvents["game:round-end"] = (payload) => {
      for (const timeoutId of flashLabelTimeoutsRef.current.values()) {
        window.clearTimeout(timeoutId);
      }
      flashLabelTimeoutsRef.current.clear();
      dispatch({
        type: "ROUND_END",
        result: {
          roundIndex: state.currentRound?.index ?? 0,
          correctAnswer: payload.correctAnswer,
          targetCountryId: payload.targetCountryId,
          scores: payload.scores,
        },
      });
    };
    const handleTimerTick: ServerToClientEvents["game:timer-tick"] = (payload) => {
      dispatch({ type: "TIMER_TICK", remaining: payload.remaining });
    };
    const handleGameEnd: ServerToClientEvents["game:end"] = (payload) => {
      dispatch({ type: "GAME_END", result: payload.result });
    };
    const handleReturnedLobby: ServerToClientEvents["game:returned-lobby"] = (payload) => {
      for (const timeoutId of flashLabelTimeoutsRef.current.values()) {
        window.clearTimeout(timeoutId);
      }
      flashLabelTimeoutsRef.current.clear();
      dispatch({ type: "RETURNED_LOBBY", players: payload.players, config: payload.config });
    };

    socket.on("room:created", handleRoomCreated);
    socket.on("room:player-joined", handlePlayerJoined);
    socket.on("room:player-left", handlePlayerLeft);
    socket.on("room:error", handleError);
    socket.on("game:round-start", handleRoundStart);
    socket.on("game:answer-result", handleAnswerResult);
    socket.on("game:round-end", handleRoundEnd);
    socket.on("game:timer-tick", handleTimerTick);
    socket.on("game:end", handleGameEnd);
    socket.on("game:returned-lobby", handleReturnedLobby);

    return () => {
      socket.off("room:created", handleRoomCreated);
      socket.off("room:player-joined", handlePlayerJoined);
      socket.off("room:player-left", handlePlayerLeft);
      socket.off("room:error", handleError);
      socket.off("game:round-start", handleRoundStart);
      socket.off("game:answer-result", handleAnswerResult);
      socket.off("game:round-end", handleRoundEnd);
      socket.off("game:timer-tick", handleTimerTick);
      socket.off("game:end", handleGameEnd);
      socket.off("game:returned-lobby", handleReturnedLobby);
      for (const timeoutId of flashLabelTimeoutsRef.current.values()) {
        window.clearTimeout(timeoutId);
      }
      flashLabelTimeoutsRef.current.clear();
    };
  }, [socket, state.currentRound?.index, state.players, state.roomCode]);

  const createRoom = useCallback((locale: string) => {
    socket?.emit("room:create", { locale });
  }, [socket]);

  const joinRoom = useCallback((code: string, name: string) => {
    const normalizedCode = code.trim().toUpperCase();
    pendingJoinCodeRef.current = normalizedCode;
    socket?.emit("room:join", { code: normalizedCode, playerName: name });
  }, [socket]);

  const updateConfig = useCallback((config: Partial<GameConfig>) => {
    dispatch({ type: "CONFIG_UPDATED", config: { ...(state.config ?? DEFAULT_GAME_CONFIG), ...config } });
    socket?.emit("room:config", config);
  }, [socket, state.config]);

  const startGame = useCallback(
    () => socket?.emit("game:start", { config: state.config ?? DEFAULT_GAME_CONFIG }),
    [socket, state.config]
  );

  const submitAnswer = useCallback((text: string) => {
    if (!state.currentRound) return;
    socket?.emit("game:answer", { text, roundIndex: state.currentRound.index });
  }, [socket, state.currentRound]);

  const nextRound = useCallback(() => socket?.emit("game:next-round"), [socket]);
  const revealAnswer = useCallback(() => socket?.emit("game:reveal-answer"), [socket]);
  const kickPlayer = useCallback((playerId: string) => {
    socket?.emit("room:kick", { playerId });
  }, [socket]);
  const returnToLobby = useCallback(() => {
    if (!socket) return;
    if (state.isHost) {
      socket.emit("game:return-lobby");
      return;
    }
  }, [socket, state.isHost]);

  return {
    state: { ...state, isHost },
    actions: {
      createRoom,
      joinRoom,
      updateConfig,
      startGame,
      submitAnswer,
      nextRound,
      revealAnswer,
      kickPlayer,
      returnToLobby,
    },
  };
}
