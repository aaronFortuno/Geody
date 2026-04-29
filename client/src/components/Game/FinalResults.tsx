import type { FC } from "react";
import type { GameResult } from "@geody/shared";
import { Button, Podium } from "../UI/index.js";

interface FinalResultsProps {
  result: GameResult;
  isHost: boolean;
  onReturnToLobby: () => void;
}

/**
 * Pantalla de resultats finals.
 *
 * Estructura:
 * 1. Podi animat (top 3): entrades escalonades en altura
 * 2. Classificació completa amb estadístiques per jugador:
 *    - Total de punts
 *    - Encerts / Total rondes
 *    - Millor ratxa
 *    - Temps de resposta mig
 * 3. Botó "Tornar al Lobby" (visible per a tothom, inicia nova partida)
 *
 * Les animacions del podi: el 3r apareix primer, llavors el 2n, llavors el 1r
 * (efecte Kahoot). Cada entrada fa un "bounce" en aparèixer.
 */
export const FinalResults: FC<FinalResultsProps> = ({
  result,
  isHost,
  onReturnToLobby,
}) => {
  return (
    <main className="final-results">
      <h1>Resultats finals</h1>
      <Podium podium={result.podium} />
      <section className="panel">
        <h2>Classificació completa</h2>
        <ol className="stats-list">
          {result.finalScores.map((player) => (
            <li key={player.playerId}>
              <strong>{player.name}</strong>
              <span>{player.totalScore} pts</span>
              <span>{player.correctAnswers} encerts</span>
              <span>Ratxa {player.bestStreak}</span>
              <span>{(player.averageResponseTimeMs / 1000).toFixed(1)}s</span>
            </li>
          ))}
        </ol>
      </section>
      <Button variant={isHost ? "primary" : "secondary"} onClick={onReturnToLobby}>
        Tornar al Lobby
      </Button>
    </main>
  );
};
