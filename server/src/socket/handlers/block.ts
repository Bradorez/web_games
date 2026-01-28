import type { Server, Socket } from "socket.io";
import { CardType } from "../../../../shared/types";
import { handleBlock } from "../../engine/challenge";
import { emitRoomState } from "../emitRoomState";
import { runAiTurn } from "../roomAi";
import { rooms } from "../roomStore";

export const handleBlockEvent = (
  io: Server,
  socket: Socket,
  payload: { claimedCard: string }
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
  const updatedState = handleBlock(state, playerId, payload.claimedCard as CardType);
  const progressedState = runAiTurn(updatedState);
  rooms[roomId] = progressedState;
  void emitRoomState(io, roomId, progressedState);
};
