import { useEffect, useRef, useState } from "react";
import { DEFAULT_GAME_CONFIG } from "@geody/shared";
import { useSocket } from "./hooks/useSocket.js";
import { useGame } from "./hooks/useGame.js";
import { HomeScreen, HostLobby, PlayerLobby } from "./components/Lobby/index.js";
import { FinalResults, GameScreen } from "./components/Game/index.js";

type AppView = "home" | "host-join" | "player-join";

export default function App() {
  const [view, setView] = useState<AppView>("home");
  const [isHost, setIsHost] = useState(false);
  const hasRequestedRoomRef = useRef(false);

  const { socket, connected } = useSocket();
  const { state, actions } = useGame(socket, isHost);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (code) setView("player-join");
  }, []);

  useEffect(() => {
    if (view !== "host-join" || !connected || hasRequestedRoomRef.current) return;
    hasRequestedRoomRef.current = true;
    actions.createRoom("ca");
  }, [actions, connected, view]);

  const connectionBanner = !connected ? (
    <div className="connection-banner">Connectant amb el servidor...</div>
  ) : null;

  if (state.phase === "playing" || state.phase === "round-results") {
    return (
      <>
        {connectionBanner}
        <GameScreen
          state={state}
          config={state.config ?? DEFAULT_GAME_CONFIG}
          onSubmitAnswer={actions.submitAnswer}
          onNextRound={actions.nextRound}
          onRevealAnswer={actions.revealAnswer}
        />
      </>
    );
  }

  if (state.phase === "final-results" && state.gameResult) {
    return (
      <>
        {connectionBanner}
        <FinalResults
          result={state.gameResult}
          isHost={state.isHost}
          onReturnToLobby={actions.returnToLobby}
        />
      </>
    );
  }

  if (state.phase === "lobby" && state.isHost && state.roomCode) {
    return (
      <>
        {connectionBanner}
        <HostLobby
          roomCode={state.roomCode}
          qrUrl={
            state.qrUrl ??
            `${window.location.origin}${window.location.pathname}?code=${state.roomCode}`
          }
          players={state.players}
          config={state.config ?? DEFAULT_GAME_CONFIG}
          onConfigChange={actions.updateConfig}
          onStartGame={actions.startGame}
          onKickPlayer={actions.kickPlayer}
        />
      </>
    );
  }

  if (view === "player-join" || (state.phase === "lobby" && !state.isHost)) {
    return (
      <>
        {connectionBanner}
        <PlayerLobby
          roomCode={state.roomCode}
          players={state.players}
          myPlayerId={state.myPlayerId}
          error={state.error}
          onJoin={actions.joinRoom}
        />
      </>
    );
  }

  return (
    <>
      {connectionBanner}
      <HomeScreen
        onCreateRoom={() => {
          setIsHost(true);
          setView("host-join");
        }}
        onJoinRoom={() => {
          setIsHost(false);
          setView("player-join");
        }}
      />
    </>
  );
}
