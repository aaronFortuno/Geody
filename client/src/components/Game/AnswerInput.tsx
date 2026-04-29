import { useRef, useState, type FC, type FormEvent } from "react";
import { Button } from "../UI/index.js";

interface AnswerInputProps {
  /** Desactiva l'input i el botó (p.ex. quan la ronda ha acabat). */
  disabled: boolean;
  /** Cridat quan el jugador envia una resposta. Passar el text trimmat. */
  onSubmit: (text: string) => void;
  /** Feedback visual: null → neutre, "correct" → verd, "incorrect" → vermell/taronja. */
  feedback?: "correct" | "incorrect" | null;
  /** Punts guanyats, mostrats al costat del feedback "correct". */
  points?: number;
}

/**
 * Camp de resposta dels alumnes.
 *
 * Comportament:
 * - Sempre visible i fixat a la part inferior de la pantalla en mòbil.
 * - Quan s'envia (tecla Enter o botó), crida onSubmit i neteja el camp.
 * - Mostra feedback visual (verd/vermell) durant ~1.5s automàticament.
 * - En mode "fastest", l'input torna a estar actiu per a noves respostes.
 * - En mode "kahoot", es desactiva (disabled=true) un cop enviat.
 * - Placeholder: text de ca.json "game.placeholder"
 * - Mida mínima del target tàctil: 44px (WCAG 2.1 AA)
 */
export const AnswerInput: FC<AnswerInputProps> = ({
  disabled,
  onSubmit,
  feedback,
  points,
}) => {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue("");
    inputRef.current?.focus();
  };

  return (
    <form className={`answer-input ${feedback ? `answer-input--${feedback}` : ""}`} onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        disabled={disabled}
        placeholder="Escriu la resposta"
        autoComplete="off"
      />
      {feedback ? (
        <span className="answer-input__feedback">
          {feedback === "correct" ? `Correcte! +${points ?? 0}` : "Incorrecte"}
        </span>
      ) : null}
      <Button type="submit" disabled={disabled || !value.trim()}>
        Enviar
      </Button>
    </form>
  );
};
