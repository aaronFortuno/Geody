import type { FC } from "react";
import type { Continent, Player, GameConfig } from "@geody/shared";
import { Button, Input } from "../UI/index.js";

interface HostLobbyProps {
  roomCode: string;
  qrUrl: string;
  players: Player[];
  config: GameConfig;
  onConfigChange: (config: Partial<GameConfig>) => void;
  onStartGame: () => void;
  onKickPlayer: (playerId: string) => void;
}

export const HostLobby: FC<HostLobbyProps> = ({
  roomCode,
  qrUrl,
  players,
  config,
  onConfigChange,
  onStartGame,
  onKickPlayer,
}) => {
  const connectedPlayers = players.filter((player) => player.connected && !player.isHost);
  const continents: Continent[] = [
    "africa",
    "asia",
    "europe",
    "north-america",
    "south-america",
    "oceania",
  ];

  const continentLabels: Record<Continent, string> = {
    africa: "Àfrica",
    asia: "Àsia",
    europe: "Europa",
    "north-america": "Amèrica del Nord",
    "south-america": "Amèrica del Sud",
    oceania: "Oceania",
  };

  const toggleContinent = (continent: Continent) => {
    const next = config.continents.includes(continent)
      ? config.continents.filter((item) => item !== continent)
      : [...config.continents, continent];
    if (next.length > 0) onConfigChange({ continents: next });
  };

  const handleTimePerRoundChange = (nextTimePerRound: number) => {
    const nextGuessLabelSeconds = Math.min(config.guessLabelSeconds, nextTimePerRound);
    onConfigChange({
      timePerRound: nextTimePerRound,
      guessLabelSeconds: nextGuessLabelSeconds,
    });
  };

  return (
    <main className="host-lobby">
      <section className="host-lobby__left">
        <section className="panel room-code-panel">
          <div className="room-code-panel__top">
            <p className="eyebrow">Codi de sala</p>
            <Button
              size="sm"
              onClick={onStartGame}
              disabled={connectedPlayers.length < 1 || config.continents.length < 1}
            >
              Iniciar
            </Button>
          </div>
          <h1>{roomCode}</h1>
          <Button variant="secondary" onClick={() => void navigator.clipboard?.writeText(roomCode)}>
            Copiar
          </Button>
          <a href={qrUrl}>{qrUrl}</a>
        </section>

        <section className="panel">
          <h2>Jugadors</h2>
          <ul className="player-list">
            {connectedPlayers.map((player) => (
              <li key={player.id} className="player-list__item">
                <span>{player.avatar ?? player.name.slice(0, 1).toUpperCase()}</span>
                <strong>{player.name}</strong>
                <Button variant="ghost" size="sm" onClick={() => onKickPlayer(player.id)}>
                  Expulsar
                </Button>
              </li>
            ))}
          </ul>
        </section>
      </section>

      <section className="panel config-panel">
        <h2>Configuració</h2>
        <div className="config-grid">
          <label className="ui-field">
            <span className="ui-label">Mode</span>
            <select
              className="ui-input"
              value={config.mode}
              onChange={(event) => onConfigChange({ mode: event.target.value as GameConfig["mode"] })}
            >
              <option value="countries">Països</option>
              <option value="capitals">Capitals</option>
              <option value="both">Mixt</option>
            </select>
          </label>
          <label className="ui-field">
            <span className="ui-label">Tipus de joc</span>
            <select
              className="ui-input"
              value={config.gameType}
              onChange={(event) =>
                onConfigChange({ gameType: event.target.value as GameConfig["gameType"] })
              }
            >
              <option value="fastest">Ràpid</option>
              <option value="kahoot">Kahoot</option>
            </select>
          </label>
          <Input
            label={`Rondes: ${config.totalRounds}`}
            type="range"
            min={5}
            max={50}
            value={config.totalRounds}
            onChange={(event) => onConfigChange({ totalRounds: Number(event.target.value) })}
          />
          <Input
            label={`Temps per ronda: ${config.timePerRound}s`}
            type="range"
            min={10}
            max={120}
            value={config.timePerRound}
            onChange={(event) => handleTimePerRoundChange(Number(event.target.value))}
          />
          <Input
            label={
              config.guessLabelUntilRoundEnd
                ? "Etiqueta resposta: fins final de ronda"
                : `Etiqueta resposta: ${config.guessLabelSeconds}s`
            }
            type="range"
            min={0}
            max={config.timePerRound}
            value={config.guessLabelSeconds}
            onChange={(event) => onConfigChange({ guessLabelSeconds: Number(event.target.value) })}
          />
        </div>

        <fieldset className="checkbox-grid">
          <legend>Continents</legend>
          <div className="continent-actions">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onConfigChange({ continents })}
            >
              Seleccionar tots
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onConfigChange({ continents: [] })}
            >
              Deseleccionar tots
            </Button>
          </div>
          {continents.map((continent) => (
            <label key={continent}>
              <input
                type="checkbox"
                checked={config.continents.includes(continent)}
                onChange={() => toggleContinent(continent)}
              />
              {continentLabels[continent]}
            </label>
          ))}
        </fieldset>

        <label className="check-row">
          <input
            type="checkbox"
            checked={config.allowAnswerChange}
            disabled={config.gameType !== "kahoot"}
            onChange={(event) => onConfigChange({ allowAnswerChange: event.target.checked })}
          />
          Permetre canvi de resposta
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={config.autoRotateGlobe}
            onChange={(event) => onConfigChange({ autoRotateGlobe: event.target.checked })}
          />
          Auto-rotar globus
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={config.guessLabelUntilRoundEnd}
            onChange={(event) => onConfigChange({ guessLabelUntilRoundEnd: event.target.checked })}
          />
          Mantenir etiqueta fins final de ronda
        </label>
      </section>
    </main>
  );
};
