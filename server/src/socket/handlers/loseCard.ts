import type { Server, Socket } from "socket.io";
import { handleLoseCardChoice } from "../../engine/challenge";
import { emitRoomState } from "../emitRoomState";
import { runAiTurn } from "../roomAi";
import { rooms } from "../roomStore";

export const handleLoseCardEvent = (
  io: Server,
  socket: Socket,
  payload: { cardId: string }
): void => {
  const roomId = socket.data.roomId as string | undefined;
  const playerId = socket.data.playerId as string | undefined;
  if (!roomId || !playerId) {
    return;
  }
  const state = rooms[roomId];
  if (!state || !state.isStarted || state.isPaused) {
    return;
  }
  const updatedState = handleLoseCardChoice(state, playerId, payload.cardId);
  const progressedState = runAiTurn(updatedState);
  rooms[roomId] = progressedState;
  void emitRoomState(io, roomId, progressedState);
};
