import type { Server, Socket } from "socket.io";
import { rooms } from "../roomStore";

export const handleEndRoom = async (
  io: Server,
  socket: Socket
): Promise<void> => {
  const roomId = socket.data.roomId as string | undefined;
  const playerId = socket.data.playerId as string | undefined;
  if (!roomId || !playerId) {
    return;
  }
  const state = rooms[roomId];
  if (!state || state.hostPlayerId !== playerId) {
    return;
  }

  delete rooms[roomId];
  const sockets = await io.in(roomId).fetchSockets();
  sockets.forEach((roomSocket) => {
    roomSocket.emit("room_ended");
    roomSocket.leave(roomId);
    roomSocket.data.roomId = undefined;
    roomSocket.data.playerId = undefined;
  });
};
