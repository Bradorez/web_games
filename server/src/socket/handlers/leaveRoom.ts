import type { Server, Socket } from "socket.io";
import { emitRoomState } from "../emitRoomState";
import { runAiTurn } from "../roomAi";
import { rooms } from "../roomStore";
import {
  pauseForDisconnect,
  removePlayer,
  setPlayerConnection,
} from "../roomLogic";

export const handleLeaveRoom = (io: Server, socket: Socket): void => {
  const roomId = socket.data.roomId as string | undefined;
  const playerId = socket.data.playerId as string | undefined;
  if (!roomId || !playerId) {
    return;
  }
  const state = rooms[roomId];
  if (!state) {
    return;
  }

  let updatedState = state;
  if (!state.isStarted) {
    updatedState = removePlayer(state, playerId);
    if (Object.keys(updatedState.players).length === 0) {
      delete rooms[roomId];
      socket.leave(roomId);
      socket.data.roomId = undefined;
      socket.data.playerId = undefined;
      return;
    }
  } else {
    updatedState = setPlayerConnection(state, playerId, false);
    if (state.players[playerId]?.isAlive) {
      updatedState = pauseForDisconnect(updatedState, playerId);
    }
  }

  const progressedState = runAiTurn(updatedState);
  rooms[roomId] = progressedState;
  socket.leave(roomId);
  socket.data.roomId = undefined;
  socket.data.playerId = undefined;
  void emitRoomState(io, roomId, progressedState);
};
