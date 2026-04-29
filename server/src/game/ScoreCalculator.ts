import type { GameConfig } from "@geody/shared";

export class ScoreCalculator {
  /**
   * Calcula els punts d'una resposta correcta.
   *
   * Fórmula:
   *   punts = pointsPerCorrect
   *         + floor(speedBonusMax * (timeRemaining / timePerRound))
   *         + (isSpellingPerfect ? spellingBonus : 0)
   *
   * @param timeRemaining    Segons restants quan s'ha enviat la resposta (≥ 0)
   * @param config           Configuració activa del joc
   * @param isSpellingPerfect  True si l'escriptura coincideix exactament
   * @returns                Punts guanyats (sempre ≥ config.pointsPerCorrect)
   */
  calculate(
    timeRemaining: number,
    config: GameConfig,
    isSpellingPerfect: boolean
  ): number {
    const points =
      config.pointsPerCorrect +
      Math.floor(config.speedBonusMax * (timeRemaining / config.timePerRound)) +
      (isSpellingPerfect ? config.spellingBonus : 0);
    return Math.max(points, config.pointsPerCorrect);
  }
}
