import type { FC } from "react";
import type { RoundResult, Player } from "@geody/shared";
import { Button } from "../UI/index.js";

interface RoundResultsProps {
  result: RoundResult;
  players: Player[];
  myPlayerId?: string;
  isHost: boolean;
  onNext: () => void;
}

/**
 * Pantalla de resultats d'una ronda.
 *
 * Mostra:
 * - La resposta correcta (nom gran i visible)
 * - Animació breu: el globus mostra el país uns 2s
 * - Llista de jugadors amb punts guanyats a la ronda
 * - Classificació acumulada
 * - Botó "Següent Ronda" (només visible per a l'amfitrió)
 *
 * Si isHost=false, el botó no apareix (l'alumne espera).
 */
export const RoundResults: FC<RoundResultsProps> = ({
  result,
  players,
  myPlayerId,
  isHost,
  onNext,
}) => {
  const byScore = [...players].filter((player) => !player.isHost).sort((a, b) => b.score - a.score);

  return (
    <section className="round-results">
      <p className="eyebrow">Resposta correcta</p>
      <h2>{result.correctAnswer}</h2>
      <ul className="round-results__scores">
        {result.scores
          .filter((score) => byScore.some((player) => player.id === score.playerId))
          .map((score) => (
            <li key={score.playerId} className={score.playerId === myPlayerId ? "is-current" : ""}>
              <strong>{score.name}</strong>
              <span>{score.isCorrect ? `+${score.pointsEarned}` : "0"} pts</span>
            </li>
          ))}
      </ul>
      {isHost ? <Button onClick={onNext}>Següent Ronda</Button> : <p>Esperant el professor...</p>}
    </section>
  );
};
