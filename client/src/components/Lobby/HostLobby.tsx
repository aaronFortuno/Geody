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

/**
 * Lobby de l'amfitrió (professor).
 *
 * Seccions:
 * 1. Codi de sala gran (per projectar) + botó "Copiar" + QR code
 * 2. Llista de jugadors connectats (nom + avatar, opció d'expulsar)
 * 3. Panell de configuració (GameConfig):
 *    - Mode: countries | capitals | both (selector)
 *    - Continents: selecció múltiple (checkboxes)
 *    - Rondes: slider 5–50
 *    - Temps per ronda: slider 10–120s
 *    - Tipus de joc: fastest | kahoot (toggle)
 *    - Permettre canvi de resposta (checkbox, només kahoot)
 *    - Auto-rotar globus (toggle)
 * 4. Botó "Iniciar Partida" (desactivat si < 1 jugador connectat)
 *
 * El QR code es genera a partir de qrUrl (URL amb el codi de sala pre-omplert).
 * Usar la llibreria `qrcode.react` o similar.
 */
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

  const toggleContinent = (continent: Continent) => {
    const next = config.continents.includes(continent)
      ? config.continents.filter((item) => item !== continent)
      : [...config.continents, continent];
    if (next.length > 0) onConfigChange({ continents: next });
  };

  return (
    <main className="host-lobby">
      <section className="panel room-code-panel">
        <p className="eyebrow">Codi de sala</p>
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

      <section className="panel config-panel">
        <h2>Configuració</h2>
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
        <fieldset className="checkbox-grid">
          <legend>Continents</legend>
          {continents.map((continent) => (
            <label key={continent}>
              <input
                type="checkbox"
                checked={config.continents.includes(continent)}
                onChange={() => toggleContinent(continent)}
              />
              {continent}
            </label>
          ))}
        </fieldset>
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
          onChange={(event) => onConfigChange({ timePerRound: Number(event.target.value) })}
        />
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
        <Button size="lg" onClick={onStartGame} disabled={connectedPlayers.length < 1}>
          Iniciar Partida
        </Button>
      </section>
    </main>
  );
};
