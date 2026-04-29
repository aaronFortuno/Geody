import type { FC } from "react";

interface TimerProps {
  /** Segons restants. */
  seconds: number;
  /** Total de segons de la ronda (per calcular el % de la barra). */
  total: number;
  /** True si queden ≤ 5 segons: canvi de color a vermell + pulsació. */
  urgent: boolean;
}

/**
 * Visualitza el temporitzador de la ronda.
 *
 * Elements visuals:
 * - Número gran de segons restants
 * - Barra de progrés horitzontal que s'omple de dreta a esquerra
 * - En mode urgent (≤5s): color vermell, text pulsant
 *
 * No gestiona el temps internament; rep `seconds` com a prop (des de useTimer).
 */
export const Timer: FC<TimerProps> = ({ seconds, total, urgent }) => {
  const progress = total > 0 ? Math.max(0, Math.min(100, (seconds / total) * 100)) : 0;

  return (
    <div className={urgent ? "timer timer--urgent" : "timer"} aria-live="polite">
      <strong>{seconds}s</strong>
      <div className="timer__track">
        <div className="timer__bar" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
};
