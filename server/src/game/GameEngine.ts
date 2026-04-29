import type { Round, RoundResult, GameResult } from "@geody/shared";
import type { Room } from "../rooms/Room.js";
import { AnswerValidator } from "../validation/AnswerValidator.js";
import { ScoreCalculator } from "./ScoreCalculator.js";
import { RoundGenerator } from "./RoundGenerator.js";
import type { CountryData } from "@geody/shared";

export interface AnswerProcessResult {
  isCorrect: boolean;
  isSpellingPerfect: boolean;
  flashCountryId?: string;  // ISO3 del pais a fer flaix (si incorrecte però real)
  points: number;
  totalScore: number;
}

export class GameEngine {
  private readonly validator = new AnswerValidator();
  private readonly scorer = new ScoreCalculator();
  private readonly generator = new RoundGenerator();

  /**
   * Inicia una partida: pre-genera rondes, transiciona la sala a "playing".
   * Modifica room.rounds, room.state, room.currentRound.
   *
   * @param room      Sala en estat "lobby" (llançarà error si no)
   * @param countries Dataset de paisos (ja fusionat amb el locale actiu)
   * @returns         Les rondes generades (còpia; room.rounds té la referència original)
   */
  startGame(room: Room, countries: CountryData[]): Round[] {
    if (room.state !== "lobby") {
      throw new Error("Game already started");
    }
    const rounds = this.generator.generateRounds(room.config, countries);
    room.rounds = rounds.map((round) => ({
      ...round,
      answers: {},
    }));
    room.state = "playing";
    room.currentRound = 0;
    room.touch();
    return room.rounds;
  }

  /**
   * Activa la ronda actual: guarda round.startedAt = now().
   * Ha de ser cridat just després d'emetre game:round-start als clients.
   */
  startRound(room: Room): void {
    const round = room.rounds[room.currentRound];
    if (!round) {
      throw new Error("Round not found");
    }
    round.startedAt = Date.now();
    room.touch();
  }

  /**
   * Processa la resposta d'un jugador.
   *
   * Mode "fastest":
   *   - Si ja ha encertat prèviament: ignora (retorna isCorrect=false, points=0)
   *   - Valida la resposta; si correcta → puntua, incrementa room.currentRound si escau
   *   - Incrementa attempts del jugador per aquesta ronda
   *
   * Mode "kahoot":
   *   - Si allowAnswerChange=false i ja ha enviat: ignora
   *   - Desa la resposta (es resoldrà a endRound)
   *   - NO retorna punts fins a endRound
   *
   * @param room       Sala activa
   * @param playerId   Socket ID del jugador
   * @param text       Text enviat
   * @param timestamp  Moment d'enviament (ms epoch, usat per calcular bonus velocitat)
   * @param countries  Dataset complet (per trobar flashCountryId)
   */
  processAnswer(
    room: Room,
    playerId: string,
    text: string,
    timestamp: number,
    countries: CountryData[]
  ): AnswerProcessResult {
    const round = room.getCurrentRound();
    const player = room.players.get(playerId);
    if (!round || round.endedAt || !player || !player.connected || player.isHost) {
      return {
        isCorrect: false,
        isSpellingPerfect: false,
        points: 0,
        totalScore: player?.score ?? 0,
      };
    }

    if (room.config.gameType === "fastest" && round.answers[playerId]?.isCorrect) {
      return {
        isCorrect: false,
        isSpellingPerfect: false,
        points: 0,
        totalScore: player.score,
      };
    }

    if (
      room.config.gameType === "kahoot" &&
      !room.config.allowAnswerChange &&
      round.answers[playerId]
    ) {
      return {
        isCorrect: false,
        isSpellingPerfect: false,
        points: 0,
        totalScore: player.score,
      };
    }

    const validation = this.validator.validate(
      text,
      round.correctAnswer,
      round.type,
      room.config.locale,
      countries
    );

    const attempts = (round.answers[playerId]?.attempts ?? 0) + 1;

    if (validation.isCorrect) {
      const startedAt = round.startedAt ?? timestamp;
      const timeRemaining = Math.max(
        0,
        room.config.timePerRound - (timestamp - startedAt) / 1000
      );
      const calculatedPoints = this.scorer.calculate(
        timeRemaining,
        room.config,
        validation.isSpellingPerfect
      );
      const points = room.config.gameType === "fastest" ? calculatedPoints : 0;
      if (room.config.gameType === "fastest") {
        player.score += calculatedPoints;
      }
      round.answers[playerId] = {
        playerId,
        text,
        timestamp,
        isCorrect: true,
        isSpellingPerfect: validation.isSpellingPerfect,
        pointsEarned: points,
        attempts,
      };
      room.touch();
      return {
        isCorrect: true,
        isSpellingPerfect: validation.isSpellingPerfect,
        points,
        totalScore: player.score,
      };
    }

    round.answers[playerId] = {
      playerId,
      text,
      timestamp,
      isCorrect: false,
      isSpellingPerfect: false,
      pointsEarned: 0,
      attempts,
    };
    room.touch();
    return {
      isCorrect: false,
      isSpellingPerfect: false,
      flashCountryId: validation.flashCountryId,
      points: 0,
      totalScore: player.score,
    };
  }

  /**
   * Tanca la ronda actual:
   * - Calcula punts de tots els jugadors (mode kahoot)
   * - Guarda round.endedAt
   * - Transiciona room.state a "round-results"
   * - Retorna RoundResult amb scores per a tots els jugadors
   */
  endRound(room: Room, countries: CountryData[]): RoundResult {
    const round = room.getCurrentRound();
    if (!round) {
      throw new Error("Round not found");
    }

    round.endedAt = Date.now();
    room.state = "round-results";

    if (room.config.gameType === "kahoot") {
      for (const player of room.players.values()) {
        if (!player.connected || player.isHost) {
          continue;
        }
        const answer = round.answers[player.id];
        if (!answer || !answer.isCorrect) {
          continue;
        }
        const startedAt = round.startedAt ?? answer.timestamp;
        const timeRemaining = Math.max(
          0,
          room.config.timePerRound - (answer.timestamp - startedAt) / 1000
        );
        const points = this.scorer.calculate(
          timeRemaining,
          room.config,
          answer.isSpellingPerfect
        );
        answer.pointsEarned = points;
        player.score += points;
      }
    }

    const scores = Array.from(room.players.values()).map((player) => {
      const answer = round.answers[player.id];
      return {
        playerId: player.id,
        name: player.name,
        pointsEarned: answer?.pointsEarned ?? 0,
        totalScore: player.score,
        isCorrect: answer?.isCorrect ?? false,
      };
    });

    room.touch();

    return {
      roundIndex: round.index,
      correctAnswer: round.correctAnswer,
      targetCountryId: round.targetCountryId,
      scores,
    };
  }

  /**
   * Finalitza la partida:
   * - Transiciona room.state a "final-results"
   * - Calcula estadístiques per jugador (encerts, ratxa, temps mig)
   * - Construeix el podi (top 3)
   * - Retorna GameResult
   */
  endGame(room: Room): GameResult {
    room.state = "final-results";

    const finalScores = Array.from(room.players.values())
      .map((player) => {
        let correctAnswers = 0;
        let perfectSpellings = 0;
        let totalResponseTimeMs = 0;
        let responseCount = 0;
        let bestStreak = 0;
        let currentStreak = 0;

        for (const round of room.rounds) {
          const answer = round.answers[player.id];
          if (answer?.isCorrect) {
            correctAnswers += 1;
            if (answer.isSpellingPerfect) {
              perfectSpellings += 1;
            }
            if (round.startedAt !== undefined) {
              totalResponseTimeMs += answer.timestamp - round.startedAt;
              responseCount += 1;
            }
            currentStreak += 1;
            if (currentStreak > bestStreak) {
              bestStreak = currentStreak;
            }
          } else {
            currentStreak = 0;
          }
        }

        const averageResponseTimeMs =
          responseCount > 0 ? Math.round(totalResponseTimeMs / responseCount) : 0;

        return {
          playerId: player.id,
          name: player.name,
          totalScore: player.score,
          correctAnswers,
          perfectSpellings,
          averageResponseTimeMs,
          bestStreak,
        };
      })
      .sort((a, b) => b.totalScore - a.totalScore);

    const podium: [
      (typeof finalScores)[number],
      (typeof finalScores)[number] | null,
      (typeof finalScores)[number] | null
    ] = [finalScores[0] as (typeof finalScores)[number], finalScores[1] ?? null, finalScores[2] ?? null];

    room.touch();

    return {
      finalScores,
      podium,
    };
  }
}
