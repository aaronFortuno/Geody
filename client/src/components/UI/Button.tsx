import type { ButtonHTMLAttributes, FC } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

/**
 * Botó reutilitzable.
 *
 * Variants:
 * - primary:   fons blau mar (#1a6b8a), text blanc
 * - secondary: fons beix (#d4c5a0), text fosc
 * - danger:    fons vermell (#cc3333), text blanc
 * - ghost:     transparent, contorn subtle
 *
 * Mida mínima: 44px height (WCAG 2.1 AA).
 * Passa tots els atributs natius de <button>.
 */
export const Button: FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  fullWidth = false,
  children,
  ...rest
}) => {
  const className = [
    "ui-button",
    `ui-button--${variant}`,
    `ui-button--${size}`,
    fullWidth ? "ui-button--full" : "",
    rest.className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button {...rest} className={className}>
      {children}
    </button>
  );
};
