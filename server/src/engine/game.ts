import { GamePhase, GameState, Player } from "../../../shared/types";
import { createDeck, shuffle } from "./deck";
import { createPlayer, modifyCoins } from "./player";

const getNextTurnPlayerId = (
  players: Record<string, Player>,
  currentPlayerId: string
): string => {
  const orderedIds = Object.keys(players);
  if (orderedIds.length === 0) {
    return "";
  }

  const startIndex = Math.max(orderedIds.indexOf(currentPlayerId), 0);

  for (let offset = 1; offset <= orderedIds.length; offset += 1) {
    const candidateId = orderedIds[(startIndex + offset) % orderedIds.length];
    if (players[candidateId]?.isAlive) {
      return candidateId;
    }
  }

  return currentPlayerId;
};

export const initializeGame = (playerIds: string[]): GameState => {
  const players: Record<string, Player> = {};

  for (const id of playerIds) {
    players[id] = createPlayer(id, id);
  }

  return {
    deck: shuffle(createDeck()),
    players,
    turnPlayerId: playerIds[0] ?? "",
    currentPhase: GamePhase.WAITING_FOR_PLAYERS,
    pot: 0,
  };
};

export const applyIncome = (state: GameState, playerId: string): GameState => {
  const player = state.players[playerId];
  if (!player) {
    return state;
  }

  const updatedPlayer = modifyCoins(player, 1);

  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: updatedPlayer,
    },
    turnPlayerId: getNextTurnPlayerId(state.players, playerId),
  };
};

export const applyForeignAid = (
  state: GameState,
  playerId: string
): GameState => {
  const player = state.players[playerId];
  if (!player) {
    return state;
  }

  const updatedPlayer = modifyCoins(player, 2);

  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: updatedPlayer,
    },
    turnPlayerId: getNextTurnPlayerId(state.players, playerId),
  };
};
