import { useState, type FC } from "react";
import type { Player } from "@geody/shared";
import { Button, Input } from "../UI/index.js";

interface PlayerLobbyProps {
  /** Si null, l'alumne encara no ha entrat a cap sala (mostra el formulari). */
  roomCode: string | null;
  players: Player[];
  myPlayerId: string | null;
  error: string | null;
  onJoin: (code: string, name: string) => void;
}

/**
 * Lobby de l'alumne.
 *
 * Fase 1 (roomCode === null):
 *   - Input "Codi de sala" (6 chars, automàticament majúscules)
 *   - Input "El teu nom" (max 20 chars)
 *   - Botó "Unir-se"
 *   - Missatge d'error si n'hi ha (sala no trobada, plena...)
 *
 * Fase 2 (roomCode !== null):
 *   - Text: "Sala: {roomCode}"
 *   - Estat: "Esperant que el professor iniciï la partida..."
 *   - Llista dels jugadors connectats
 *   - Avatar/nom del propi jugador ressaltat
 *
 * En Fase 1, si la URL conté ?code=XXXXX, pre-omple el camp de codi.
 */
export const PlayerLobby: FC<PlayerLobbyProps> = ({
  roomCode,
  players,
  myPlayerId,
  error,
  onJoin,
}) => {
  const initialCode = new URLSearchParams(window.location.search).get("code") ?? "";
  const [code, setCode] = useState(initialCode.toUpperCase());
  const [name, setName] = useState("");

  if (roomCode) {
    return (
      <main className="lobby">
        <section className="panel">
          <p className="eyebrow">Sala</p>
          <h1>{roomCode}</h1>
          <p>Esperant que el professor iniciï la partida...</p>
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
        <h1>Unir-se a una sala</h1>
        <Input
          label="Codi de sala"
          value={code}
          maxLength={6}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="ABC123"
          autoComplete="off"
        />
        <Input
          label="El teu nom"
          value={name}
          maxLength={20}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nom"
          autoComplete="name"
          error={error ?? undefined}
        />
        <Button type="submit" size="lg" fullWidth disabled={!code.trim() || !name.trim()}>
          Unir-se
        </Button>
      </form>
    </main>
  );
};
