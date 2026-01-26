import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { GamePhase, GameState } from "../../shared/types";
import { createPlayer } from "./engine/player";
import { handleAction, initializeGame } from "./engine/game";
import { GameAction } from "./engine/actionTypes";
import { handleChallenge, handlePass } from "./engine/challenge";
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

  const emitRoomState = async (
    roomId: string,
    state: GameState
  ): Promise<void> => {
    const sockets = await io.in(roomId).fetchSockets();
    sockets.forEach((roomSocket) => {
      const playerId = roomSocket.data.playerId as string | undefined;
      roomSocket.emit(
        "game_state_update",
        maskState(state, playerId ?? "")
      );
    });
  };

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

      const readyState =
        updatedState.currentPhase === GamePhase.WAITING_FOR_PLAYERS
          ? {
              ...updatedState,
              currentPhase: GamePhase.ACTION_DECLARATION,
              turnPlayerId: updatedState.turnPlayerId || playerId,
            }
          : updatedState;

      rooms[roomId] = readyState;
      socket.data.roomId = roomId;
      socket.data.playerId = playerId;
      socket.join(roomId);
      void emitRoomState(roomId, readyState);
    });

    socket.on("perform_action", (payload: GameAction) => {
      const roomId = socket.data.roomId as string | undefined;
      const playerId = socket.data.playerId as string | undefined;
      if (!roomId || !playerId) {
        return;
      }

      const state = rooms[roomId];
      if (!state) {
        return;
      }

      const action: GameAction = {
        ...payload,
        sourcePlayerId: payload.sourcePlayerId ?? playerId,
      };
      const updatedState = handleAction(state, action);
      rooms[roomId] = updatedState;
      void emitRoomState(roomId, updatedState);
    });

    socket.on("challenge", () => {
      const roomId = socket.data.roomId as string | undefined;
      const playerId = socket.data.playerId as string | undefined;
      if (!roomId || !playerId) {
        return;
      }

      const state = rooms[roomId];
      if (!state) {
        return;
      }

      const updatedState = handleChallenge(state, playerId);
      rooms[roomId] = updatedState;
      void emitRoomState(roomId, updatedState);
    });

    socket.on("pass", () => {
      const roomId = socket.data.roomId as string | undefined;
      const playerId = socket.data.playerId as string | undefined;
      if (!roomId || !playerId) {
        return;
      }

      const state = rooms[roomId];
      if (!state) {
        return;
      }

      const updatedState = handlePass(state, playerId);
      rooms[roomId] = updatedState;
      void emitRoomState(roomId, updatedState);
    });
  });
};
