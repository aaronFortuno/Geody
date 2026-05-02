import type { FC } from "react";
import type { GameResult } from "@geody/shared";
import { useI18n } from "../../i18n/I18nProvider.js";
import { Button, Podium } from "../UI/index.js";

interface FinalResultsProps {
  result: GameResult;
  isHost: boolean;
  onReturnToLobby: () => void;
}

export const FinalResults: FC<FinalResultsProps> = ({
  result,
  isHost,
  onReturnToLobby,
}) => {
  const { t } = useI18n();

  return (
    <main className="final-results">
      <h1>{t("results.finalTitle")}</h1>
      <Podium podium={result.podium} />
      <section className="panel">
        <h2>{t("results.fullRanking")}</h2>
        <ol className="stats-list">
          {result.finalScores.map((player) => (
            <li key={player.playerId}>
              <strong>{player.name}</strong>
              <span>{t("results.points", { value: player.totalScore })}</span>
              <span>{t("results.correctAnswers", { value: player.correctAnswers })}</span>
              <span>{t("results.streak", { value: player.bestStreak })}</span>
              <span>{(player.averageResponseTimeMs / 1000).toFixed(1)}s</span>
            </li>
          ))}
        </ol>
      </section>
      {isHost ? (
        <Button variant="primary" onClick={onReturnToLobby}>
          {t("results.backToLobby")}
        </Button>
      ) : (
        <p>{t("results.waitingHost")}</p>
      )}
    </main>
  );
};

