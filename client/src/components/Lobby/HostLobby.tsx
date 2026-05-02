import type { FC } from "react";
import type { Continent, GameConfig, Player } from "@geody/shared";
import { useI18n } from "../../i18n/I18nProvider.js";
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
  const { t } = useI18n();
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
    africa: t("host.continent.africa"),
    asia: t("host.continent.asia"),
    europe: t("host.continent.europe"),
    "north-america": t("host.continent.northAmerica"),
    "south-america": t("host.continent.southAmerica"),
    oceania: t("host.continent.oceania"),
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
            <p className="eyebrow">{t("host.roomCode")}</p>
            <Button
              size="sm"
              onClick={onStartGame}
              disabled={connectedPlayers.length < 1 || config.continents.length < 1}
            >
              {t("host.start")}
            </Button>
          </div>
          <h1>{roomCode}</h1>
          <Button variant="secondary" onClick={() => void navigator.clipboard?.writeText(roomCode)}>
            {t("host.copy")}
          </Button>
          <a href={qrUrl}>{qrUrl}</a>
        </section>

        <section className="panel">
          <h2>{t("host.players")}</h2>
          <ul className="player-list">
            {connectedPlayers.map((player) => (
              <li key={player.id} className="player-list__item">
                <span>{player.avatar ?? player.name.slice(0, 1).toUpperCase()}</span>
                <strong>{player.name}</strong>
                <Button variant="ghost" size="sm" onClick={() => onKickPlayer(player.id)}>
                  {t("host.kick")}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      </section>

      <section className="panel config-panel">
        <h2>{t("host.config")}</h2>
        <div className="config-grid">
          <label className="ui-field">
            <span className="ui-label">{t("host.mode")}</span>
            <select
              className="ui-input"
              value={config.mode}
              onChange={(event) => onConfigChange({ mode: event.target.value as GameConfig["mode"] })}
            >
              <option value="countries">{t("host.mode.countries")}</option>
              <option value="capitals">{t("host.mode.capitals")}</option>
              <option value="both">{t("host.mode.both")}</option>
            </select>
          </label>
          <label className="ui-field">
            <span className="ui-label">{t("host.gameType")}</span>
            <select
              className="ui-input"
              value={config.gameType}
              onChange={(event) =>
                onConfigChange({ gameType: event.target.value as GameConfig["gameType"] })
              }
            >
              <option value="fastest">{t("host.gameType.fastest")}</option>
              <option value="kahoot">{t("host.gameType.kahoot")}</option>
            </select>
          </label>
          <Input
            label={t("host.rounds", { value: config.totalRounds })}
            type="range"
            min={5}
            max={50}
            value={config.totalRounds}
            onChange={(event) => onConfigChange({ totalRounds: Number(event.target.value) })}
          />
          <Input
            label={t("host.timePerRound", { value: config.timePerRound })}
            type="range"
            min={10}
            max={120}
            value={config.timePerRound}
            onChange={(event) => handleTimePerRoundChange(Number(event.target.value))}
          />
          <Input
            label={
              config.guessLabelUntilRoundEnd
                ? t("host.guessLabel.untilRound")
                : t("host.guessLabel.seconds", { value: config.guessLabelSeconds })
            }
            type="range"
            min={0}
            max={config.timePerRound}
            value={config.guessLabelSeconds}
            onChange={(event) => onConfigChange({ guessLabelSeconds: Number(event.target.value) })}
          />
        </div>

        <fieldset className="checkbox-grid">
          <legend>{t("host.continents")}</legend>
          <div className="continent-actions">
            <Button type="button" variant="ghost" size="sm" onClick={() => onConfigChange({ continents })}>
              {t("host.selectAll")}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => onConfigChange({ continents: [] })}>
              {t("host.unselectAll")}
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
          {t("host.allowAnswerChange")}
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={config.autoRotateGlobe}
            onChange={(event) => onConfigChange({ autoRotateGlobe: event.target.checked })}
          />
          {t("host.autoRotate")}
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={config.guessLabelUntilRoundEnd}
            onChange={(event) => onConfigChange({ guessLabelUntilRoundEnd: event.target.checked })}
          />
          {t("host.keepLabelUntilRoundEnd")}
        </label>
      </section>
    </main>
  );
};

