import type { FC } from "react";
import type { GameState } from "../../hooks/useGame.js";
import type { GameConfig } from "@geody/shared";
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
}) => {
  const round = state.currentRound;
  const totalRounds = config.totalRounds;

  return (
    <main className="game-screen">
      <section className="game-screen__stage">
        <div className="game-screen__topbar">
          <span>
            Ronda {round ? round.index + 1 : "-"} / {totalRounds}
          </span>
          <Timer
            seconds={state.timeRemaining}
            total={config.timePerRound}
            urgent={state.timeRemaining <= 5}
          />
        </div>
        <div className="globe-shell">
          <Globe
            targetCountryId={round?.targetCountryId ?? state.roundResult?.targetCountryId}
            flashCountryId={state.flashCountryId ?? undefined}
            autoRotate={config.autoRotateGlobe}
          />
          {state.phase === "round-results" && state.roundResult ? (
            <RoundResults
              result={state.roundResult}
              players={state.players}
              myPlayerId={state.myPlayerId ?? undefined}
              isHost={state.isHost}
              onNext={onNextRound}
            />
          ) : null}
        </div>
        {!state.isHost && state.phase === "playing" ? (
          <AnswerInput
            disabled={!round}
            onSubmit={onSubmitAnswer}
            feedback={state.answerFeedback}
            points={state.lastPointsEarned}
          />
        ) : null}
      </section>

      <aside className="game-screen__side">
        <Scoreboard players={state.players} myPlayerId={state.myPlayerId ?? undefined} />
        {state.isHost && state.phase === "playing" ? (
          <Button variant="secondary" onClick={onRevealAnswer}>
            Mostrar Resposta
          </Button>
        ) : null}
      </aside>
    </main>
  );
};
