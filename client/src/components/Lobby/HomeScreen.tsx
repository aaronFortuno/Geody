import { useEffect, useMemo, useState, type FC } from "react";
import projectStatus from "../../content/projectStatus.json";
import { Globe } from "../Globe/index.js";
import { Button } from "../UI/index.js";

interface HomeScreenProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export const HomeScreen: FC<HomeScreenProps> = ({ onCreateRoom, onJoinRoom }) => {
  const [aboutOpen, setAboutOpen] = useState(false);

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
      <section className="home-screen__globe-stage" aria-label="Globus interactiu de presentacio">
        <div className="home-screen__globe">
          <Globe
            autoRotate={false}
            idleSpin
            idleSpinSecondsPerTurn={150}
            showCapitalMarkers={false}
          />
        </div>
      </section>

      <section className="home-screen__content">
        <h1>Geody</h1>
        <p>El joc de geografia per a aules</p>
        <div className="home-screen__actions">
          <Button size="lg" onClick={onCreateRoom}>
            Crear Sala
          </Button>
          <Button size="lg" variant="secondary" onClick={onJoinRoom}>
            Unir-se a una Sala
          </Button>
        </div>
      </section>

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
            aria-label="Informacio del projecte"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="modal-card__header">
              <h2>{projectStatus.title}</h2>
              <Button size="sm" variant="ghost" onClick={() => setAboutOpen(false)}>
                Tancar
              </Button>
            </header>

            <p className="modal-card__meta">
              Versio {projectStatus.version} - {projectStatus.releasedAt}
            </p>
            <p>{projectStatus.status}</p>

            <h3>Inclou</h3>
            <ul className="modal-card__list">
              {projectStatus.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h3>Seguent focus</h3>
            <ul className="modal-card__list">
              {projectStatus.nextFocus.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <div className="modal-card__links">
              <a href={githubRepoUrl} target="_blank" rel="noreferrer">
                Repositori GitHub
              </a>
              <a href={licenseUrl} target="_blank" rel="noreferrer">
                Llicencia {projectStatus.license}
              </a>
              <a href={changelogUrl} target="_blank" rel="noreferrer">
                Historial de versions
              </a>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
};
