import type { FC } from "react";
import type { Player, RoundResult } from "@geody/shared";
import { useI18n } from "../../i18n/I18nProvider.js";
import { Button } from "../UI/index.js";

interface RoundResultsProps {
  result: RoundResult;
  players: Player[];
  myPlayerId?: string;
  isHost: boolean;
  onNext: () => void;
}

export const RoundResults: FC<RoundResultsProps> = ({
  result,
  players,
  myPlayerId,
  isHost,
  onNext,
}) => {
  const { t } = useI18n();
  const byScore = [...players].filter((player) => !player.isHost).sort((a, b) => b.score - a.score);

  return (
    <section className="round-results">
      <p className="eyebrow">{t("results.correctAnswer")}</p>
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
      {isHost ? <Button onClick={onNext}>{t("game.nextRound")}</Button> : <p>{t("game.waitingTeacher")}</p>}
    </section>
  );
};

