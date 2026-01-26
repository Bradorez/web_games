import { io } from "socket.io-client";

const createPlayerId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const serverUrl = import.meta.env.VITE_SERVER_URL ?? "http://localhost:3001";
const playerId = createPlayerId();

export const socket = io(serverUrl, { autoConnect: false });

export const joinGame = (roomId: string, playerName: string): string => {
  if (!socket.connected) {
    socket.connect();
  }

  socket.emit("join_game", { roomId, playerId, name: playerName });
  return playerId;
};

export const sendAction = (action: unknown): void => {
  socket.emit("action", action);
};
