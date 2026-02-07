import { BattleshipState, GameState } from "../../shared/types";

export const rooms: Record<string, GameState> = {};
export const battleshipRooms: Record<string, BattleshipState> = {};

const ROOM_CODE_LENGTH = 6;
const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const generateRoomCode = (): string => {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i += 1) {
    const index = Math.floor(Math.random() * ROOM_CODE_CHARS.length);
    code += ROOM_CODE_CHARS[index];
  }
  return code;
};

export const createRoomCode = (): string => {
  let code = generateRoomCode();
  while (rooms[code] || battleshipRooms[code]) {
    code = generateRoomCode();
  }
  return code;
};
