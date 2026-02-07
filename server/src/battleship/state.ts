import {
  BattleshipPhase,
  BattleshipPlayer,
  BattleshipShip,
  BattleshipState,
  BattleshipPoint,
} from "../../shared/types";
import { BOARD_SIZE, SHIP_SIZES, TURN_DURATION_MS } from "./constants";

const createShip = (size: number): BattleshipShip => ({
  id: `${size}-${Math.random().toString(16).slice(2, 6)}`,
  size,
  positions: [],
  hits: [],
  isSunk: false,
});

export const createPlayer = (id: string, name: string): BattleshipPlayer => ({
  id,
  name,
  isConnected: true,
  isReady: false,
  ships: SHIP_SIZES.map((size) => createShip(size)),
  shots: [],
});

export const createBattleshipState = (
  roomId: string,
  hostId: string,
  hostName: string
): BattleshipState => ({
  roomId,
  phase: BattleshipPhase.Placing,
  players: {
    [hostId]: createPlayer(hostId, hostName),
  },
  hostPlayerId: hostId,
  turnPlayerId: hostId,
  winnerPlayerId: "",
  turnExpiresAt: Date.now() + TURN_DURATION_MS,
  gameLog: [],
});

export const isInsideBoard = (point: BattleshipPoint): boolean =>
  point.x >= 0 && point.x < BOARD_SIZE && point.y >= 0 && point.y < BOARD_SIZE;

export const pointsEqual = (a: BattleshipPoint, b: BattleshipPoint): boolean =>
  a.x === b.x && a.y === b.y;
