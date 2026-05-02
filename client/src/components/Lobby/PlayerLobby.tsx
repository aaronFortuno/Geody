import { useState, type FC } from "react";
import type { Player } from "@geody/shared";
import { useI18n } from "../../i18n/I18nProvider.js";
import { Button, Input } from "../UI/index.js";

interface PlayerLobbyProps {
  roomCode: string | null;
  players: Player[];
  myPlayerId: string | null;
  error: string | null;
  onJoin: (code: string, name: string) => void;
}

export const PlayerLobby: FC<PlayerLobbyProps> = ({
  roomCode,
  players,
  myPlayerId,
  error,
  onJoin,
}) => {
  const { t } = useI18n();
  const initialCode = new URLSearchParams(window.location.search).get("code") ?? "";
  const [code, setCode] = useState(initialCode.toUpperCase());
  const [name, setName] = useState("");

  if (roomCode) {
    return (
      <main className="lobby">
        <section className="panel">
          <p className="eyebrow">{t("lobby.room")}</p>
          <h1>{roomCode}</h1>
          <p>{t("lobby.waitingHost")}</p>
          <ul className="player-list">
            {players.map((player) => (
              <li
                key={player.id}
                className={player.id === myPlayerId ? "player-list__item is-current" : "player-list__item"}
              >
                <span>{player.avatar ?? player.name.slice(0, 1).toUpperCase()}</span>
                <strong>{player.name}</strong>
              </li>
            ))}
          </ul>
        </section>
      </main>
    );
  }

  return (
    <main className="lobby">
      <form
        className="panel lobby-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (code.trim() && name.trim()) onJoin(code, name);
        }}
      >
        <h1>{t("lobby.joinRoom")}</h1>
        <Input
          label={t("lobby.roomCode")}
          value={code}
          maxLength={6}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="ABC123"
          autoComplete="off"
        />
        <Input
          label={t("lobby.yourName")}
          value={name}
          maxLength={20}
          onChange={(event) => setName(event.target.value)}
          placeholder={t("lobby.placeholderName")}
          autoComplete="name"
          error={error ?? undefined}
        />
        <Button type="submit" size="lg" fullWidth disabled={!code.trim() || !name.trim()}>
          {t("lobby.joinButton")}
        </Button>
      </form>
    </main>
  );
};

