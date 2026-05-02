import { useRef, useState, type FC, type FormEvent } from "react";
import { useI18n } from "../../i18n/I18nProvider.js";
import { Button } from "../UI/index.js";

interface AnswerInputProps {
  disabled: boolean;
  onSubmit: (text: string) => void;
  feedback?: "correct" | "incorrect" | null;
  points?: number;
}

export const AnswerInput: FC<AnswerInputProps> = ({
  disabled,
  onSubmit,
  feedback,
  points,
}) => {
  const { t } = useI18n();
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
        placeholder={t("game.answer.placeholder")}
        autoComplete="off"
      />
      {feedback ? (
        <span className="answer-input__feedback">
          {feedback === "correct"
            ? t("game.answer.correct", { points: points ?? 0 })
            : t("game.answer.incorrect")}
        </span>
      ) : null}
      <Button type="submit" disabled={disabled || !value.trim()}>
        {t("game.answer.submit")}
      </Button>
    </form>
  );
};

