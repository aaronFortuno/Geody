import type { InputHTMLAttributes, FC } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

/**
 * Input de text reutilitzable amb label i missatge d'error.
 *
 * Mida: font-size ≥ 16px per evitar zoom automàtic en iOS.
 * Mida mínima del target tàctil: 44px height.
 * Contorn de focus visible (outline 2px) per accessibilitat.
 */
export const Input: FC<InputProps> = ({ label, error, hint, ...rest }) => {
  const inputId = rest.id ?? rest.name;

  return (
    <label className="ui-field" htmlFor={inputId}>
      {label ? <span className="ui-label">{label}</span> : null}
      <input
        {...rest}
        id={inputId}
        className={["ui-input", error ? "ui-input--error" : "", rest.className ?? ""]
          .filter(Boolean)
          .join(" ")}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? `${inputId}-message` : undefined}
      />
      {error || hint ? (
        <span
          id={`${inputId}-message`}
          className={error ? "ui-message ui-message--error" : "ui-message"}
        >
          {error ?? hint}
        </span>
      ) : null}
    </label>
  );
};
