import { useEffect, useMemo, useState, type FC } from "react";
import { Languages } from "lucide-react";
import projectStatus from "../../content/projectStatus.json";
import { useI18n } from "../../i18n/I18nProvider.js";
import type { UILocale } from "../../i18n/messages.js";
import { Globe } from "../Globe/index.js";
import { Button } from "../UI/index.js";

interface HomeScreenProps {
  locale: UILocale;
  onLocaleChange: (locale: UILocale) => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export const HomeScreen: FC<HomeScreenProps> = ({
  locale,
  onLocaleChange,
  onCreateRoom,
  onJoinRoom,
}) => {
  const [aboutOpen, setAboutOpen] = useState(false);
  const { t } = useI18n();

  const githubRepoUrl = useMemo(() => {
    const host = window.location.hostname;
    const firstPath = window.location.pathname.split("/").filter(Boolean)[0];
    if (host.endsWith("github.io") && firstPath) {
      const owner = host.replace(".github.io", "");
      return `https://github.com/${owner}/${firstPath}`;
    }
    return "https://github.com/aaronfortuno/Geody";
  }, []);

  const changelogUrl = useMemo(
    () => `${githubRepoUrl}/blob/main/${projectStatus.changelogPath}`,
    [githubRepoUrl]
  );
  const licenseUrl = useMemo(() => `${githubRepoUrl}/blob/main/LICENSE`, [githubRepoUrl]);
  const tipsQrUrl = useMemo(
    () =>
      `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
        projectStatus.tipsLightningAddress
      )}`,
    []
  );

  useEffect(() => {
    if (!aboutOpen) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAboutOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [aboutOpen]);

  return (
    <main className="home-screen">
      <section className="home-screen__globe-stage" aria-label="Interactive presentation globe">
        <div className="home-screen__globe">
          <Globe autoRotate={false} idleSpin idleSpinSecondsPerTurn={150} showCapitalMarkers={false} />
        </div>
      </section>

      <section className="home-screen__content">
        <h1>{t("home.title")}</h1>
        <p>{t("home.subtitle")}</p>
        <div className="home-screen__actions">
          <Button size="lg" onClick={onCreateRoom}>
            {t("home.create")}
          </Button>
          <Button size="lg" variant="secondary" onClick={onJoinRoom}>
            {t("home.join")}
          </Button>
        </div>
      </section>

      <div className="home-screen__language">
        <Languages size={16} />
        <label htmlFor="language-select" className="sr-only">
          {t("home.language")}
        </label>
        <select
          id="language-select"
          className="home-screen__language-select"
          value={locale}
          onChange={(event) => onLocaleChange(event.target.value as UILocale)}
        >
          <option value="ca">Catala</option>
          <option value="es">Espanol</option>
          <option value="en">English</option>
        </select>
      </div>

      <footer className="home-screen__footer">
        <button type="button" className="home-screen__version" onClick={() => setAboutOpen(true)}>
          {projectStatus.version}
        </button>
      </footer>

      {aboutOpen ? (
        <div className="modal-backdrop" onClick={() => setAboutOpen(false)} role="presentation">
          <section
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-label="Project info"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="modal-card__header">
              <h2>{projectStatus.title[locale]}</h2>
              <Button size="sm" variant="ghost" onClick={() => setAboutOpen(false)}>
                {t("home.version.close")}
              </Button>
            </header>

            <p className="modal-card__meta">
              {t("home.version.meta", {
                version: projectStatus.version,
                date: projectStatus.releasedAt,
              })}
            </p>
            <p>{projectStatus.status[locale]}</p>

            <h3>{t("home.version.includes")}</h3>
            <ul className="modal-card__list">
              {projectStatus.highlights[locale].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h3>{t("home.version.nextFocus")}</h3>
            <ul className="modal-card__list">
              {projectStatus.nextFocus[locale].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <div className="modal-card__links">
              <a href={githubRepoUrl} target="_blank" rel="noreferrer">
                {t("home.version.github")}
              </a>
              <a href={licenseUrl} target="_blank" rel="noreferrer">
                {t("home.version.license", { license: projectStatus.license })}
              </a>
              <a href={changelogUrl} target="_blank" rel="noreferrer">
                {t("home.version.changelog")}
              </a>
              <a href={projectStatus.portfolioUrl} target="_blank" rel="noreferrer">
                {t("home.version.portfolio")}
              </a>
            </div>

            <div className="tips-card">
              <p className="tips-card__title">{t("home.version.tips")}</p>
              <code>{projectStatus.tipsLightningAddress}</code>
              <img src={tipsQrUrl} alt="Lightning tips QR code" />
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
};

