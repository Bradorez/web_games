import type { Server, Socket } from "socket.io";
import { GameAction } from "../engine/actionTypes";
import { handleAction } from "../engine/game";
import { handleChallenge, handlePass } from "../engine/challenge";
import { emitRoomState } from "./emitRoomState";
import { rooms, createRoomCode } from "./roomStore";
import {
  createRoomState,
  maybeResume,
  pauseForDisconnect,
  setPlayerConnection,
  startGameState,
  upsertPlayer,
} from "./roomLogic";
type CreateRoomPayload = { playerId: string; name: string };
type JoinRoomPayload = { roomId: string; playerId: string; name: string };

export const registerSocketHandlers = (io: Server, socket: Socket): void => {
  socket.on("create_room", (payload: CreateRoomPayload) => {
    const { playerId, name } = payload;
    const roomId = createRoomCode();
    const updatedState = createRoomState(playerId, name);

    rooms[roomId] = updatedState;
    socket.data.roomId = roomId;
    socket.data.playerId = playerId;
    socket.join(roomId);
    socket.emit("room_created", { roomId });
    void emitRoomState(io, roomId, updatedState);
  });

  socket.on("join_room", (payload: JoinRoomPayload) => {
    const { roomId, playerId, name } = payload;
    const state = rooms[roomId];
    if (!state) {
      socket.emit("room_error", { message: "Room not found." });
      return;
    }
    if (state.isStarted && !state.players[playerId]) {
      socket.emit("room_error", { message: "Game already started." });
      return;
    }

    let updatedState = upsertPlayer(state, playerId, name);
    if (updatedState.isPaused) {
      updatedState = maybeResume(updatedState);
    }

    rooms[roomId] = updatedState;
    socket.data.roomId = roomId;
    socket.data.playerId = playerId;
    socket.join(roomId);
    void emitRoomState(io, roomId, updatedState);
  });

  socket.on("start_game", () => {
    const roomId = socket.data.roomId as string | undefined;
    const playerId = socket.data.playerId as string | undefined;
    if (!roomId || !playerId) {
      return;
    }

    const state = rooms[roomId];
    if (!state || state.isStarted || state.hostPlayerId !== playerId) {
      return;
    }

    const updatedState = startGameState(state);
    rooms[roomId] = updatedState;
    void emitRoomState(io, roomId, updatedState);
  });

  socket.on("perform_action", (payload: GameAction) => {
    const roomId = socket.data.roomId as string | undefined;
    const playerId = socket.data.playerId as string | undefined;
    if (!roomId || !playerId) {
      return;
    }

    const state = rooms[roomId];
    if (!state || !state.isStarted || state.isPaused) {
      return;
    }

    const action: GameAction = {
      ...payload,
      sourcePlayerId: payload.sourcePlayerId ?? playerId,
    };
    const updatedState = handleAction(state, action);
    rooms[roomId] = updatedState;
    void emitRoomState(io, roomId, updatedState);
  });

  socket.on("challenge", () => {
    const roomId = socket.data.roomId as string | undefined;
    const playerId = socket.data.playerId as string | undefined;
    if (!roomId || !playerId) {
      return;
    }

    const state = rooms[roomId];
    if (!state || !state.isStarted || state.isPaused) {
      return;
    }

    const updatedState = handleChallenge(state, playerId);
    rooms[roomId] = updatedState;
    void emitRoomState(io, roomId, updatedState);
  });

  socket.on("pass", () => {
    const roomId = socket.data.roomId as string | undefined;
    const playerId = socket.data.playerId as string | undefined;
    if (!roomId || !playerId) {
      return;
    }

    const state = rooms[roomId];
    if (!state || !state.isStarted || state.isPaused) {
      return;
    }

    const updatedState = handlePass(state, playerId);
    rooms[roomId] = updatedState;
    void emitRoomState(io, roomId, updatedState);
  });

  socket.on("disconnect", () => {
    const roomId = socket.data.roomId as string | undefined;
    const playerId = socket.data.playerId as string | undefined;
    if (!roomId || !playerId) {
      return;
    }

    const state = rooms[roomId];
    if (!state) {
      return;
    }

    const disconnectedState = setPlayerConnection(state, playerId, false);
    const shouldPause = state.isStarted && state.players[playerId]?.isAlive;
    const pausedState = shouldPause
      ? pauseForDisconnect(disconnectedState, playerId)
      : disconnectedState;

    rooms[roomId] = pausedState;
    void emitRoomState(io, roomId, pausedState);
  });
};
