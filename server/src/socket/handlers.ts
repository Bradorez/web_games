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
import { runAiTurn } from "./roomAi";
import { handleLeaveRoom } from "./handlers/leaveRoom";
import { handleRestartGame } from "./handlers/restartGame";
import { handleEndRoom } from "./handlers/endRoom";
type CreateRoomPayload = { playerId: string; name: string; aiCount?: number };
type JoinRoomPayload = { roomId: string; playerId: string; name: string };
export const registerSocketHandlers = (io: Server, socket: Socket): void => {
  socket.on("create_room", (payload: CreateRoomPayload) => {
    const { playerId, name } = payload;
    const aiCount = Math.max(0, Math.min(payload.aiCount ?? 0, 5));
    const roomId = createRoomCode();
    const updatedState = createRoomState(roomId, playerId, name, aiCount);
    const progressedState = runAiTurn(updatedState);
    rooms[roomId] = progressedState;
    socket.data.roomId = roomId;
    socket.data.playerId = playerId;
    socket.join(roomId);
    socket.emit("room_created", { roomId });
    void emitRoomState(io, roomId, progressedState);
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
    const progressedState = runAiTurn(updatedState);
    rooms[roomId] = progressedState;
    socket.data.roomId = roomId;
    socket.data.playerId = playerId;
    socket.join(roomId);
    void emitRoomState(io, roomId, progressedState);
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
    const progressedState = runAiTurn(updatedState);
    rooms[roomId] = progressedState;
    void emitRoomState(io, roomId, progressedState);
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
    const progressedState = runAiTurn(updatedState);
    rooms[roomId] = progressedState;
    void emitRoomState(io, roomId, progressedState);
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
    const progressedState = runAiTurn(updatedState);
    rooms[roomId] = progressedState;
    void emitRoomState(io, roomId, progressedState);
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
    const progressedState = runAiTurn(updatedState);
    rooms[roomId] = progressedState;
    void emitRoomState(io, roomId, progressedState);
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
    const progressedState = runAiTurn(pausedState);
    rooms[roomId] = progressedState;
    void emitRoomState(io, roomId, progressedState);
  });
  socket.on("leave_room", () => {
    handleLeaveRoom(io, socket);
  });
  socket.on("restart_game", () => {
    handleRestartGame(io, socket);
  });
  socket.on("end_room", () => {
    void handleEndRoom(io, socket);
  });
};
