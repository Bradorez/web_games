import type { Server, Socket } from "socket.io";
import { emitRoomState } from "../emitRoomState";
import { runAiTurn } from "../roomAi";
import { rooms } from "../roomStore";
import { restartGameState } from "../roomReset";

export const handleRestartGame = (io: Server, socket: Socket): void => {
  const roomId = socket.data.roomId as string | undefined;
  const playerId = socket.data.playerId as string | undefined;
  if (!roomId || !playerId) {
    return;
  }
  const state = rooms[roomId];
  if (!state || !state.isGameOver || state.hostPlayerId !== playerId) {
    return;
  }

  const restartedState = restartGameState(state);
  const progressedState = runAiTurn(restartedState);
  rooms[roomId] = progressedState;
  void emitRoomState(io, roomId, progressedState);
};
