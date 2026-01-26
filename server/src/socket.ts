import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { GameState } from "../../shared/types";
import { createPlayer } from "./engine/player";
import { initializeGame } from "./engine/game";
import { maskState } from "./utils/sanitizer";

type JoinGamePayload = {
  roomId: string;
  playerId: string;
  name: string;
};

const rooms: Record<string, GameState> = {};

const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

export const setupSocket = (httpServer: HttpServer): void => {
  const io = new Server(httpServer, {
    cors: {
      origin: clientOrigin,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected");

    socket.on("join_game", (payload: JoinGamePayload) => {
      const { roomId, playerId, name } = payload;
      const hadRoom = Boolean(rooms[roomId]);
      const baseState = rooms[roomId] ?? initializeGame([playerId]);
      const hasPlayer = Boolean(baseState.players[playerId]);
      const shouldInsertPlayer = !hadRoom || !hasPlayer;

      const updatedState = shouldInsertPlayer
        ? {
            ...baseState,
            players: {
              ...baseState.players,
              [playerId]: createPlayer(playerId, name),
            },
          }
        : baseState;

      rooms[roomId] = updatedState;
      socket.join(roomId);
      socket.emit("game_state_update", maskState(updatedState, playerId));
    });

    socket.on("action", () => {
      return;
    });
  });
};
