import type { FC } from "react";
import type { GameState } from "../../hooks/useGame.js";
import type { GameConfig } from "@geody/shared";
import { useI18n } from "../../i18n/I18nProvider.js";
import { Globe } from "../Globe/index.js";
import { Button } from "../UI/index.js";
import { AnswerInput } from "./AnswerInput.js";
import { RoundResults } from "./RoundResults.js";
import { Scoreboard } from "./Scoreboard.js";
import { Timer } from "./Timer.js";

interface GameScreenProps {
  state: GameState;
  config: GameConfig;
  onSubmitAnswer: (text: string) => void;
  onNextRound: () => void;
  onRevealAnswer: () => void;
  onEndGame: () => void;
}

/**
 * Pantalla principal de joc (fase "playing" i "round-results").
 *
 * Layout desktop (> 1024px):
 *   [Globus 80%] | [Timer + Scoreboard lateral]
 *   [AnswerInput a sota del globus — alumnes]
 *
 * Layout mòbil (< 768px):
 *   [Globus 60%]
 *   [Timer]
 *   [AnswerInput fixat a baix — alumnes]
 *   [Scoreboard en overlay/botó]
 *
 * Vista amfitrió:
 *   - Sense AnswerInput
 *   - Botó "Mostrar Resposta" + "Següent Ronda" (apareix en round-results)
 *
 * Gestiona la transició entre fase "playing" → "round-results":
 *   Quan state.phase === "round-results", renderitza RoundResults
 *   damunt del globus (overlay o substitució).
 */
export const GameScreen: FC<GameScreenProps> = ({
  state,
  config,
  onSubmitAnswer,
  onNextRound,
  onRevealAnswer,
  onEndGame,
}) => {
  const { t } = useI18n();
  const round = state.currentRound;
  const totalRounds = config.totalRounds;
  const flashLabels = state.flashLabels.map((entry) => ({
    id: entry.id,
    countryId: entry.countryId,
    label: entry.label,
    byName: state.players.find((player) => player.id === entry.byPlayerId)?.name,
    durationMs: entry.durationMs,
    untilRoundEnd: entry.untilRoundEnd,
  }));

  return (
    <main className="game-screen">
      <section className="game-screen__stage">
        <div className="game-screen__topbar">
          <div className="game-screen__meta">
            <span>
              {t("game.round")} {round ? round.index + 1 : "-"} / {totalRounds}
            </span>
            {state.roomCode ? <span className="game-screen__room-code">{t("game.room")} {state.roomCode}</span> : null}
          </div>
          <Timer
            seconds={state.timeRemaining}
            total={config.timePerRound}
            urgent={state.timeRemaining <= 5}
          />
          {!state.isHost && state.phase === "playing" ? (
            <div className="game-screen__inline-answer">
              <AnswerInput
                disabled={!round}
                onSubmit={onSubmitAnswer}
                feedback={state.answerFeedback}
                points={state.lastPointsEarned}
              />
            </div>
          ) : null}
        </div>
        <div className="globe-shell">
          <Globe
            targetCountryId={round?.targetCountryId ?? state.roundResult?.targetCountryId}
            flashCountryId={state.flashCountryId ?? undefined}
            roundType={round?.type}
            autoRotate={config.autoRotateGlobe}
            flashLabels={flashLabels}
          />
        </div>
      </section>

      <aside className="game-screen__side">
        <Scoreboard players={state.players} myPlayerId={state.myPlayerId ?? undefined} />
        {state.isHost && state.phase === "playing" ? (
          <>
            <Button variant="secondary" onClick={onRevealAnswer}>
              {t("game.reveal")}
            </Button>
            <Button variant="danger" onClick={onEndGame}>
              {t("game.end")}
            </Button>
          </>
        ) : null}
        {state.isHost && state.phase === "round-results" ? (
          <Button variant="danger" onClick={onEndGame}>
            {t("game.end")}
          </Button>
        ) : null}
        {state.phase === "round-results" && state.roundResult ? (
          <RoundResults
            result={state.roundResult}
            players={state.players}
            myPlayerId={state.myPlayerId ?? undefined}
            isHost={state.isHost}
            onNext={onNextRound}
          />
        ) : null}
      </aside>
    </main>
  );
};
