import type { FC } from "react";
import type { Player } from "@geody/shared";
import { useI18n } from "../../i18n/I18nProvider.js";

interface ScoreboardProps {
  players: Player[];
  myPlayerId?: string;
  compact?: boolean;
}

export const Scoreboard: FC<ScoreboardProps> = ({ players, myPlayerId, compact }) => {
  const { t } = useI18n();
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
      <h2>{t("game.scoreboard")}</h2>
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

