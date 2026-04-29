import type { FC } from "react";
import type { PlayerStats } from "@geody/shared";

interface PodiumProps {
  /** Fins a 3 jugadors; podium[0]=1r, [1]=2n, [2]=3r. */
  podium: [PlayerStats, PlayerStats | null, PlayerStats | null];
}

/**
 * Podi animat dels 3 primers classificats.
 *
 * Layout visual:
 *       [2n]  [1r]  [3r]      ← l'ordre d'aparició és: 3r → 2n → 1r
 *       ████  ████  ███
 *       ████  ████  ███
 *             ████
 *
 * Animació seqüencial (stagger):
 *   0ms:    3r apareix amb bounce
 *   400ms:  2n apareix amb bounce
 *   800ms:  1r apareix amb bounce + confeti
 *
 * Cada entrada mostra: avatar, nom i puntuació total.
 */
export const Podium: FC<PodiumProps> = ({ podium }) => {
  const ordered = [
    { player: podium[1], rank: 2, label: "2n" },
    { player: podium[0], rank: 1, label: "1r" },
    { player: podium[2], rank: 3, label: "3r" },
  ];

  return (
    <div className="podium" aria-label="Podi final">
      {ordered.map(({ player, rank, label }) => (
        <div
          key={rank}
          className={`podium__slot podium__slot--${rank}`}
          style={{ animationDelay: `${rank === 3 ? 0 : rank === 2 ? 400 : 800}ms` }}
        >
          <div className="podium__player">
            <span className="podium__avatar">{player?.name.slice(0, 1).toUpperCase() ?? "-"}</span>
            <strong>{player?.name ?? "Sense jugador"}</strong>
            <span>{player ? `${player.totalScore} pts` : ""}</span>
          </div>
          <div className="podium__block">{label}</div>
        </div>
      ))}
    </div>
  );
};
