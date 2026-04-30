import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import type { ClientToServerEvents, ServerToClientEvents } from "@geody/shared";
import { RoomManager } from "./rooms/RoomManager.js";
import { GameEngine } from "./game/GameEngine.js";
import { CountryLoader } from "./data/CountryLoader.js";
import { registerHandlers } from "./socket/handlers.js";

const PORT = parseInt(process.env["PORT"] ?? "3001", 10);
const RAW_CLIENT_ORIGIN = process.env["CLIENT_ORIGIN"] ?? "http://localhost:5173";

function normalizeOrigin(input: string): string {
  try {
    return new URL(input).origin;
  } catch {
    return input.replace(/\/+$/, "");
  }
}

const CLIENT_ORIGIN = normalizeOrigin(RAW_CLIENT_ORIGIN);

const app = express();
const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST"],
  },
});

// Rate limiting: màx 5 creacions de sala per minut per IP
const roomCreateAttempts = new Map<string, number[]>();
const ROOM_CREATE_WINDOW_MS = 60_000;
const ROOM_CREATE_MAX_ATTEMPTS = 5;

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

// Health check per a Render
app.get("/health", (_req, res) => {
  res.json({ status: "ok", rooms: roomManager.getAllRooms().length });
});

const roomManager = new RoomManager();
const gameEngine = new GameEngine();
const countryLoader = new CountryLoader();

io.on("connection", (socket) => {
  socket.use((packet, next) => {
    const [eventName] = packet;
    if (eventName !== "room:create") {
      next();
      return;
    }

    const address = socket.handshake.address;
    const now = Date.now();
    const attempts = (roomCreateAttempts.get(address) ?? []).filter(
      (timestamp) => now - timestamp < ROOM_CREATE_WINDOW_MS
    );

    if (attempts.length >= ROOM_CREATE_MAX_ATTEMPTS) {
      socket.emit("room:error", {
        message: "Massa creacions de sala. Torna-ho a provar en un minut.",
        code: "GAME_IN_PROGRESS",
      });
      return;
    }

    attempts.push(now);
    roomCreateAttempts.set(address, attempts);
    next();
  });

  registerHandlers(socket, io, roomManager, gameEngine, countryLoader);
});

httpServer.listen(PORT, () => {
  console.log(`Geody server running on port ${PORT}`);
});
