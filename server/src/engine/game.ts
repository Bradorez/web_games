import { GamePhase, GameState } from "../../shared/types";
import { createDeck, shuffle } from "./deck";
import { createPlayer } from "./player";
import { applyPotCoins } from "./challengeHelpers";
import { getNextTurnPlayerId } from "./turn";
import { initiateAction, type GameAction } from "./challenge";

const STARTING_POT = 50;

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
    pot: STARTING_POT,
    hostPlayerId: playerIds[0] ?? "",
    isStarted: false,
    isGameOver: false,
    winnerPlayerId: "",
    isPaused: false,
    pausedPlayerId: "",
    pendingAction: null,
    pendingDiscardPlayerId: "",
    pendingResolution: null,
    pendingExchange: null,
    gameLog: [],
  };
};

export const applyIncome = (state: GameState, playerId: string): GameState => {
  const player = state.players[playerId];
  if (!player) {
    return state;
  }

  const nextState = applyPotCoins(state, playerId, 1);

  return {
    ...nextState,
    turnPlayerId: getNextTurnPlayerId(nextState.players, playerId),
    currentPhase: GamePhase.ACTION_DECLARATION,
    pendingAction: null,
    pendingDiscardPlayerId: "",
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

  const nextState = applyPotCoins(state, playerId, 2);

  return {
    ...nextState,
    turnPlayerId: getNextTurnPlayerId(nextState.players, playerId),
    currentPhase: GamePhase.ACTION_DECLARATION,
    pendingAction: null,
    pendingDiscardPlayerId: "",
  };
};

export const handleAction = (
  state: GameState,
  action: GameAction
): GameState => {
  if (!state.isStarted || state.isPaused) {
    return state;
  }
  if (state.isGameOver) {
    return state;
  }

  return initiateAction(state, action);
};
