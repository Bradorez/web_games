import {
  BattleshipPhase,
  BattleshipPlayer,
  BattleshipPoint,
  BattleshipShip,
  BattleshipState,
} from "../../shared/types";
import { TURN_DURATION_MS } from "./constants";
import { appendLog } from "./log";
import { isInsideBoard, pointsEqual } from "./state";

const clonePoint = (point: BattleshipPoint): BattleshipPoint => ({
  x: point.x,
  y: point.y,
});

const normalizeShips = (ships: BattleshipShip[]): BattleshipShip[] =>
  ships.map((ship) => ({
    ...ship,
    positions: ship.positions.map(clonePoint),
    hits: ship.hits.map(clonePoint),
  }));

const setPlayer = (
  state: BattleshipState,
  playerId: string,
  player: BattleshipPlayer
): BattleshipState => ({
  ...state,
  players: {
    ...state.players,
    [playerId]: player,
  },
});

export const upsertPlayer = (
  state: BattleshipState,
  playerId: string,
  name: string
): BattleshipState => {
  if (state.players[playerId]) {
    return setPlayer(state, playerId, { ...state.players[playerId], name, isConnected: true });
  }
  const newPlayer: BattleshipPlayer = {
    id: playerId,
    name,
    isConnected: true,
    isReady: false,
    ships: state.players[state.hostPlayerId]?.ships.map((ship) => ({
      ...ship,
      positions: [],
      hits: [],
      isSunk: false,
    })) ?? [],
    shots: [],
  };
  return setPlayer(state, playerId, newPlayer);
};

export const setPlayerConnection = (
  state: BattleshipState,
  playerId: string,
  isConnected: boolean
): BattleshipState => {
  const player = state.players[playerId];
  if (!player) return state;
  return setPlayer(state, playerId, { ...player, isConnected });
};

const allShipsPlaced = (player: BattleshipPlayer): boolean =>
  player.ships.every((ship) => ship.positions.length === ship.size);

const buildOccupied = (ships: BattleshipShip[]): BattleshipPoint[] =>
  ships.flatMap((ship) => ship.positions);

const isOverlap = (ships: BattleshipShip[], point: BattleshipPoint): boolean =>
  ships.some((ship) => ship.positions.some((pos) => pointsEqual(pos, point)));

export const placeShips = (
  state: BattleshipState,
  playerId: string,
  ships: BattleshipShip[]
): BattleshipState => {
  const player = state.players[playerId];
  if (!player) return state;
  if (state.phase !== BattleshipPhase.Placing) return state;

  const sanitized = normalizeShips(ships);
  if (sanitized.length !== player.ships.length) {
    return state;
  }
  const sizeMismatch = sanitized.some((ship, index) => ship.size !== player.ships[index]?.size);
  if (sizeMismatch) {
    return state;
  }
  const invalidLengths = sanitized.some((ship) => ship.positions.length !== ship.size);
  if (invalidLengths) {
    return state;
  }
  const occupied = buildOccupied(sanitized);
  const valid =
    occupied.length > 0 &&
    occupied.every(isInsideBoard) &&
    occupied.every((point, index) => !occupied.slice(0, index).some((p) => pointsEqual(p, point)));

  if (!valid) return state;

  const updatedPlayer: BattleshipPlayer = {
    ...player,
    ships: sanitized,
    isReady: allShipsPlaced({ ...player, ships: sanitized }),
  };

  let updatedState = setPlayer(state, playerId, updatedPlayer);
  updatedState = appendLog(updatedState, `${player.name} is ready.`);

  const readyPlayers = Object.values(updatedState.players).filter((p) => p.isReady);
  if (readyPlayers.length >= 2) {
    const firstId = readyPlayers[0]?.id ?? playerId;
    updatedState = {
      ...updatedState,
      phase: BattleshipPhase.InProgress,
      turnPlayerId: firstId,
      turnExpiresAt: Date.now() + TURN_DURATION_MS,
    };
    updatedState = appendLog(updatedState, "Battle begins!");
  }

  return updatedState;
};

const markHit = (ship: BattleshipShip, shot: BattleshipPoint): BattleshipShip => {
  const alreadyHit = ship.hits.some((hit) => pointsEqual(hit, shot));
  const nextHits = alreadyHit ? ship.hits : [...ship.hits, shot];
  const isSunk = ship.positions.every((pos) =>
    nextHits.some((hit) => pointsEqual(hit, pos))
  );
  return { ...ship, hits: nextHits, isSunk };
};

const applyShot = (player: BattleshipPlayer, shot: BattleshipPoint): BattleshipPlayer => {
  if (player.shots.some((s) => pointsEqual(s, shot))) {
    return player;
  }
  return { ...player, shots: [...player.shots, shot] };
};

const getOpponentId = (state: BattleshipState, playerId: string): string =>
  Object.keys(state.players).find((id) => id !== playerId) ?? "";

const allSunk = (ships: BattleshipShip[]): boolean =>
  ships.length > 0 && ships.every((ship) => ship.isSunk);

export const fireAt = (
  state: BattleshipState,
  playerId: string,
  target: BattleshipPoint
): BattleshipState => {
  if (state.phase !== BattleshipPhase.InProgress) return state;
  if (state.turnPlayerId !== playerId) return state;
  const attacker = state.players[playerId];
  const opponentId = getOpponentId(state, playerId);
  const defender = state.players[opponentId];
  if (!attacker || !defender) return state;
  if (!isInsideBoard(target)) return state;
  if (attacker.shots.some((shot) => pointsEqual(shot, target))) return state;

  const updatedAttacker = applyShot(attacker, target);
  let updatedDefender = defender;
  let hitShip: BattleshipShip | null = null;

  updatedDefender = {
    ...defender,
    ships: defender.ships.map((ship) => {
      if (ship.positions.some((pos) => pointsEqual(pos, target))) {
        hitShip = ship;
        return markHit(ship, target);
      }
      return ship;
    }),
  };

  let updatedState = setPlayer(setPlayer(state, playerId, updatedAttacker), opponentId, updatedDefender);
  updatedState = appendLog(
    updatedState,
    hitShip
      ? `${attacker.name} hits ${defender.name}!`
      : `${attacker.name} misses.`
  );

  if (hitShip) {
    const sunkShip = updatedDefender.ships.find((ship) => ship.id === hitShip?.id);
    if (sunkShip?.isSunk) {
      updatedState = appendLog(updatedState, `${attacker.name} sank a ship!`);
    }
  }

  if (allSunk(updatedDefender.ships)) {
    return {
      ...appendLog(updatedState, `${attacker.name} wins the battle.`),
      phase: BattleshipPhase.GameOver,
      winnerPlayerId: attacker.id,
    };
  }

  return {
    ...updatedState,
    turnPlayerId: opponentId,
    turnExpiresAt: Date.now() + TURN_DURATION_MS,
  };
};

export const maybeExpireTurn = (state: BattleshipState): BattleshipState => {
  if (state.phase !== BattleshipPhase.InProgress) return state;
  if (Date.now() < state.turnExpiresAt) return state;
  const nextId = getOpponentId(state, state.turnPlayerId);
  if (!nextId) return state;
  return {
    ...appendLog(state, `${state.players[state.turnPlayerId]?.name ?? "Player"} ran out of time.`),
    turnPlayerId: nextId,
    turnExpiresAt: Date.now() + TURN_DURATION_MS,
  };
};
