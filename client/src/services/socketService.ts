import { io } from "socket.io-client";

const createPlayerId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const serverUrl = import.meta.env.VITE_SERVER_URL ?? "http://localhost:3001";
const PLAYER_KEY_PREFIX = "coup:playerId:";
const LAST_ROOM_KEY = "coup:lastRoomId";
const NAME_KEY = "coup:playerName";

export const socket = io(serverUrl, { autoConnect: false });

const canUseStorage = (): boolean =>
  typeof window !== "undefined" && typeof localStorage !== "undefined";

const getStoredPlayerId = (roomId: string): string | null => {
  if (!canUseStorage()) {
    return null;
  }
  return localStorage.getItem(`${PLAYER_KEY_PREFIX}${roomId}`);
};

export const saveSession = (
  roomId: string,
  playerId: string,
  playerName: string
): void => {
  if (!canUseStorage()) {
    return;
  }
  localStorage.setItem(`${PLAYER_KEY_PREFIX}${roomId}`, playerId);
  localStorage.setItem(LAST_ROOM_KEY, roomId);
  localStorage.setItem(NAME_KEY, playerName);
};

export const clearSession = (roomId: string): void => {
  if (!canUseStorage()) {
    return;
  }
  localStorage.removeItem(`${PLAYER_KEY_PREFIX}${roomId}`);
  const lastRoomId = localStorage.getItem(LAST_ROOM_KEY);
  if (lastRoomId === roomId) {
    localStorage.removeItem(LAST_ROOM_KEY);
  }
};

export const getSavedSession = (): {
  roomId: string;
  playerId: string;
  playerName: string;
} | null => {
  if (!canUseStorage()) {
    return null;
  }
  const roomId = localStorage.getItem(LAST_ROOM_KEY);
  const playerName = localStorage.getItem(NAME_KEY);
  if (!roomId || !playerName) {
    return null;
  }
  const playerId = getStoredPlayerId(roomId);
  if (!playerId) {
    return null;
  }
  return { roomId, playerId, playerName };
};

const ensureConnected = (): void => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const createRoom = (playerName: string, aiCount: number): string => {
  ensureConnected();
  const playerId = createPlayerId();
  socket.emit("create_room", { playerId, name: playerName, aiCount });
  return playerId;
};

export const joinRoom = (roomId: string, playerName: string): string => {
  ensureConnected();
  const storedId = getStoredPlayerId(roomId);
  const playerId = storedId ?? createPlayerId();
  socket.emit("join_room", { roomId, playerId, name: playerName });
  return playerId;
};

export const startGame = (): void => {
  ensureConnected();
  socket.emit("start_game");
};

export const leaveRoom = (): void => {
  if (socket.connected) {
    socket.emit("leave_room");
  }
};

export const sendAction = (payload: unknown): void => {
  if (payload && typeof payload === "object" && "event" in payload) {
    const typedPayload = payload as { event: string } & Record<string, unknown>;
    if (typedPayload.event === "perform_action") {
      socket.emit("perform_action", typedPayload.action);
      return;
    }
    if (typedPayload.event === "challenge") {
      socket.emit("challenge");
      return;
    }
    if (typedPayload.event === "pass") {
      socket.emit("pass");
      return;
    }
    if (typedPayload.event === "start_game") {
      socket.emit("start_game");
      return;
    }
    if (typedPayload.event === "restart_game") {
      socket.emit("restart_game");
      return;
    }
    if (typedPayload.event === "end_room") {
      socket.emit("end_room");
      return;
    }
    if (typedPayload.event === "exchange_choice") {
      if ("keepCardIds" in typedPayload && Array.isArray(typedPayload.keepCardIds)) {
        socket.emit("exchange_choice", { keepCardIds: typedPayload.keepCardIds });
      }
      return;
    }
    if (typedPayload.event === "block") {
      if ("claimedCard" in typedPayload && typeof typedPayload.claimedCard === "string") {
        socket.emit("block", { claimedCard: typedPayload.claimedCard });
      }
      return;
    }
    if (typedPayload.event === "lose_card") {
      if ("cardId" in typedPayload && typeof typedPayload.cardId === "string") {
        socket.emit("lose_card", { cardId: typedPayload.cardId });
      }
      return;
    }
  }

  socket.emit("perform_action", payload);
};
