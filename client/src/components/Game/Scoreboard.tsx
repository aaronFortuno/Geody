import type { FC } from "react";
import type { Player } from "@geody/shared";

interface ScoreboardProps {
  players: Player[];
  /** ISO3 del jugador actual: es ressalta a la llista. */
  myPlayerId?: string;
  /** Mode compacte per a mòbil (overlay o mini-panell lateral). */
  compact?: boolean;
}

/**
 * Classificació en temps real.
 *
 * Mostra els jugadors ordenats per score descendent.
 * Limita a les primeres 10 posicions (amb scroll si cal).
 * El jugador actual sempre és visible (es puja al primer grup si no hi és).
 * En mode compacte: fons semitransparent, mida reduïda, max 5 posicions.
 *
 * Cada entrada:
 *   #1 [Nom]    1234 pts
 *   ★  [Jo]      987 pts  ← ressaltat
 */
export const Scoreboard: FC<ScoreboardProps> = ({ players, myPlayerId, compact }) => {
  const sorted = [...players]
    .filter((player) => !player.isHost)
    .sort((a, b) => b.score - a.score);
  const limit = compact ? 5 : 10;
  const visible = sorted.slice(0, limit);
  const current = myPlayerId ? sorted.find((player) => player.id === myPlayerId) : undefined;
  const entries =
    current && !visible.some((player) => player.id === current.id)
      ? [...visible.slice(0, Math.max(0, limit - 1)), current]
      : visible;

  return (
    <aside className={compact ? "scoreboard scoreboard--compact" : "scoreboard"}>
      <h2>Classificació</h2>
      <ol>
        {entries.map((player) => (
          <li key={player.id} className={player.id === myPlayerId ? "is-current" : ""}>
            <span>{sorted.findIndex((item) => item.id === player.id) + 1}</span>
            <strong>{player.name}</strong>
            <em>{player.score} pts</em>
          </li>
        ))}
      </ol>
    </aside>
  );
};
