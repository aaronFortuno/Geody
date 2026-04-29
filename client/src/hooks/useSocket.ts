import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@geody/shared";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SERVER_URL = import.meta.env["VITE_SERVER_URL"] ?? "http://localhost:3001";

/**
 * Crea i gestiona una connexió Socket.IO.
 *
 * Comportament:
 * - Connecta automàticament en muntar el component.
 * - Desconnecta en desmuntar.
 * - Reconnexió automàtica gestionada per Socket.IO (reintentos exponencials).
 * - El socket no es recrea si l'url no canvia (referència estable).
 *
 * @param url   URL del servidor (per defecte: VITE_SERVER_URL || localhost:3001)
 * @returns     { socket, connected }
 */
export function useSocket(url?: string): {
  socket: AppSocket | null;
  connected: boolean;
} {
  const socketRef = useRef<AppSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const resolvedUrl = url ?? SERVER_URL;

  useEffect(() => {
    const socket: AppSocket = io(resolvedUrl, { autoConnect: true });
    socketRef.current = socket;

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [resolvedUrl]);

  return { socket: socketRef.current, connected };
}
