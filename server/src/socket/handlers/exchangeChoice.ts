import type { Server, Socket } from "socket.io";
import { handleExchangeChoice } from "../../engine/challenge";
import { emitRoomState } from "../emitRoomState";
import { runAiTurn } from "../roomAi";
import { rooms } from "../roomStore";

export const handleExchangeChoiceEvent = (
  io: Server,
  socket: Socket,
  payload: { keepCardIds: string[] }
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
  const updatedState = handleExchangeChoice(
    state,
    playerId,
    payload.keepCardIds
  );
  const progressedState = runAiTurn(updatedState);
  rooms[roomId] = progressedState;
  void emitRoomState(io, roomId, progressedState);
};
