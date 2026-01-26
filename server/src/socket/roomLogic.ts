import { GamePhase, GameState } from "../../../shared/types";
import { createPlayer } from "../engine/player";
import { initializeGame } from "../engine/game";

export const createRoomState = (
  playerId: string,
  name: string
): GameState => {
  const baseState = initializeGame([playerId]);
  return {
    ...baseState,
    currentPhase: GamePhase.WAITING_FOR_PLAYERS,
    hostPlayerId: playerId,
    isStarted: false,
    isPaused: false,
    pausedPlayerId: "",
    players: {
      ...baseState.players,
      [playerId]: createPlayer(playerId, name),
    },
  };
};

export const upsertPlayer = (
  state: GameState,
  playerId: string,
  name: string
): GameState => {
  const existing = state.players[playerId];
  const player = existing
    ? { ...existing, name, isConnected: true }
    : createPlayer(playerId, name);

  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: player,
    },
  };
};

export const setPlayerConnection = (
  state: GameState,
  playerId: string,
  isConnected: boolean
): GameState => {
  const existing = state.players[playerId];
  if (!existing) {
    return state;
  }

  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...existing,
        isConnected,
      },
    },
  };
};

export const maybeResume = (state: GameState): GameState => {
  const disconnected = Object.values(state.players).some(
    (player) => player.isAlive && !player.isConnected
  );
  if (disconnected) {
    return state;
  }

  return {
    ...state,
    isPaused: false,
    pausedPlayerId: "",
  };
};

export const startGameState = (state: GameState): GameState => ({
  ...state,
  isStarted: true,
  isPaused: false,
  pausedPlayerId: "",
  currentPhase: GamePhase.ACTION_DECLARATION,
  turnPlayerId: state.turnPlayerId || state.hostPlayerId,
});

export const pauseForDisconnect = (
  state: GameState,
  playerId: string
): GameState => ({
  ...state,
  isPaused: true,
  pausedPlayerId: playerId,
});
