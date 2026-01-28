import { Server } from "socket.io";
import { GameState } from "../../shared/types";
import { maskState } from "../utils/sanitizer";

export const emitRoomState = async (
  io: Server,
  roomId: string,
  state: GameState
): Promise<void> => {
  const sockets = await io.in(roomId).fetchSockets();
  sockets.forEach((roomSocket) => {
    const playerId = roomSocket.data.playerId as string | undefined;
    roomSocket.emit("game_state_update", maskState(state, playerId ?? ""));
  });
};
