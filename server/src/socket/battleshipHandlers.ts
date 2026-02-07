import type { Server, Socket } from "socket.io";
import { BattleshipPoint, BattleshipShip } from "../../shared/types";
import { battleshipRooms, createRoomCode } from "./roomStore";
import { createBattleshipState } from "../battleship/state";
import { appendLog } from "../battleship/log";
import { maskBattleshipState } from "../battleship/mask";
import { fireAt, maybeExpireTurn, placeShips, setPlayerConnection, upsertPlayer } from "../battleship/logic";
import { resetBattleshipState } from "../battleship/reset";

type CreateRoomPayload = { playerId: string; name: string };
type JoinRoomPayload = { roomId: string; playerId: string; name: string };

const emitBattleshipState = async (io: Server, roomId: string, state: ReturnType<typeof maskBattleshipState>) => {
  const sockets = await io.in(roomId).fetchSockets();
  sockets.forEach((roomSocket) => {
    const playerId = roomSocket.data.playerId as string | undefined;
    if (!playerId) return;
    roomSocket.emit("battleship_state_update", maskBattleshipState(state, playerId));
  });
};

let tickerStarted = false;

export const registerBattleshipHandlers = (io: Server, socket: Socket): void => {
  if (!tickerStarted) {
    tickerStarted = true;
    setInterval(() => {
      Object.entries(battleshipRooms).forEach(([roomId, state]) => {
        const updated = maybeExpireTurn(state);
        if (updated !== state) {
          battleshipRooms[roomId] = updated;
          void emitBattleshipState(io, roomId, updated);
        }
      });
    }, 1000);
  }
  socket.on("battleship_create_room", (payload: CreateRoomPayload) => {
    const { playerId, name } = payload;
    const roomId = createRoomCode();
    const baseState = createBattleshipState(roomId, playerId, name);
    const updatedState = appendLog(baseState, "Battleship room created.");
    battleshipRooms[roomId] = updatedState;
    socket.data.roomId = roomId;
    socket.data.playerId = playerId;
    socket.join(roomId);
    socket.emit("room_created", { roomId });
    void emitBattleshipState(io, roomId, updatedState);
  });

  socket.on("battleship_join_room", (payload: JoinRoomPayload) => {
    const { roomId, playerId, name } = payload;
    const state = battleshipRooms[roomId];
    if (!state) {
      socket.emit("room_error", { message: "Room not found." });
      return;
    }
    const playerIds = Object.keys(state.players);
    if (!state.players[playerId] && playerIds.length >= 2) {
      socket.emit("room_error", { message: "Room is full." });
      return;
    }
    const updatedState = appendLog(upsertPlayer(state, playerId, name), `${name} joined the room.`);
    battleshipRooms[roomId] = updatedState;
    socket.data.roomId = roomId;
    socket.data.playerId = playerId;
    socket.join(roomId);
    void emitBattleshipState(io, roomId, updatedState);
  });

  socket.on("battleship_place_ships", (payload: { ships: BattleshipShip[] }) => {
    const roomId = socket.data.roomId as string | undefined;
    const playerId = socket.data.playerId as string | undefined;
    if (!roomId || !playerId) return;
    const state = battleshipRooms[roomId];
    if (!state) return;
    const updatedState = placeShips(state, playerId, payload.ships);
    battleshipRooms[roomId] = updatedState;
    void emitBattleshipState(io, roomId, updatedState);
  });

  socket.on("battleship_fire", (payload: BattleshipPoint) => {
    const roomId = socket.data.roomId as string | undefined;
    const playerId = socket.data.playerId as string | undefined;
    if (!roomId || !playerId) return;
    const state = battleshipRooms[roomId];
    if (!state) return;
    const progressed = maybeExpireTurn(state);
    const updatedState = fireAt(progressed, playerId, payload);
    battleshipRooms[roomId] = updatedState;
    void emitBattleshipState(io, roomId, updatedState);
  });

  socket.on("battleship_restart", () => {
    const roomId = socket.data.roomId as string | undefined;
    const playerId = socket.data.playerId as string | undefined;
    if (!roomId || !playerId) return;
    const state = battleshipRooms[roomId];
    if (!state || state.hostPlayerId !== playerId) return;
    const updatedState = resetBattleshipState(state);
    battleshipRooms[roomId] = updatedState;
    void emitBattleshipState(io, roomId, updatedState);
  });

  socket.on("battleship_leave", () => {
    const roomId = socket.data.roomId as string | undefined;
    const playerId = socket.data.playerId as string | undefined;
    if (!roomId || !playerId) return;
    const state = battleshipRooms[roomId];
    if (!state) return;
    const updatedState = setPlayerConnection(state, playerId, false);
    battleshipRooms[roomId] = updatedState;
    socket.leave(roomId);
    socket.data.roomId = undefined;
    void emitBattleshipState(io, roomId, updatedState);
  });

  socket.on("battleship_end_room", () => {
    const roomId = socket.data.roomId as string | undefined;
    if (!roomId) return;
    delete battleshipRooms[roomId];
    io.in(roomId).emit("room_ended");
    const sockets = io.sockets.sockets;
    sockets.forEach((roomSocket) => {
      if (roomSocket.rooms.has(roomId)) {
        roomSocket.leave(roomId);
        roomSocket.data.roomId = undefined;
      }
    });
  });

  socket.on("disconnect", () => {
    const roomId = socket.data.roomId as string | undefined;
    const playerId = socket.data.playerId as string | undefined;
    if (!roomId || !playerId) return;
    const state = battleshipRooms[roomId];
    if (!state) return;
    const updatedState = setPlayerConnection(state, playerId, false);
    battleshipRooms[roomId] = updatedState;
    void emitBattleshipState(io, roomId, updatedState);
  });
};
