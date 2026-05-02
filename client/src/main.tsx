import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.js";
import { I18nProvider } from "./i18n/I18nProvider.js";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>
);
