import { createContext, useContext, useEffect, useMemo, useState, type FC, type ReactNode } from "react";
import { formatMessage, messages, type UILocale } from "./messages.js";

interface I18nContextValue {
  locale: UILocale;
  setLocale: (locale: UILocale) => void;
  t: (key: keyof (typeof messages)["ca"], params?: Record<string, string | number>) => string;
}

const STORAGE_KEY = "geody.ui.locale";

const I18nContext = createContext<I18nContextValue | null>(null);

function detectInitialLocale(): UILocale {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "ca" || saved === "es" || saved === "en") return saved;
  // Product decision: Catalan is the default locale.
  return "ca";
}

export const I18nProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<UILocale>(() => detectInitialLocale());

  const setLocale = (next: UILocale) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, params) => {
        const template = messages[locale][key] ?? messages.ca[key] ?? String(key);
        return formatMessage(template, params);
      },
    }),
    [locale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return context;
}
