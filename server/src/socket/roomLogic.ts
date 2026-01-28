import { GamePhase, GameState } from "../../../shared/types";
import { createPlayer } from "../engine/player";
import { initializeGame } from "../engine/game";

const createBotId = (seed: string, index: number): string =>
  `bot-${seed}-${index}-${Math.random().toString(16).slice(2, 6)}`;

export const createRoomState = (
  roomId: string,
  playerId: string,
  name: string,
  aiCount: number
): GameState => {
  const baseState = initializeGame([playerId]);
  const players: GameState["players"] = {
    ...baseState.players,
    [playerId]: createPlayer(playerId, name),
  };

  for (let i = 0; i < aiCount; i += 1) {
    const botId = createBotId(roomId, i + 1);
    players[botId] = createPlayer(botId, `AI ${i + 1}`, true);
  }

  return {
    ...baseState,
    currentPhase: GamePhase.WAITING_FOR_PLAYERS,
    hostPlayerId: playerId,
    isStarted: false,
    isGameOver: false,
    winnerPlayerId: "",
    isPaused: false,
    pausedPlayerId: "",
    players,
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

export const removePlayer = (
  state: GameState,
  playerId: string
): GameState => {
  if (!state.players[playerId]) {
    return state;
  }
  const { [playerId]: _, ...remainingPlayers } = state.players;
  const remainingIds = Object.keys(remainingPlayers);
  const hostPlayerId =
    playerId === state.hostPlayerId ? remainingIds[0] ?? "" : state.hostPlayerId;
  const turnPlayerId =
    playerId === state.turnPlayerId
      ? (hostPlayerId || remainingIds[0] || "")
      : state.turnPlayerId;

  return {
    ...state,
    players: remainingPlayers,
    hostPlayerId,
    turnPlayerId,
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
  isGameOver: false,
  winnerPlayerId: "",
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
