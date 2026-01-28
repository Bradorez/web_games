import { GamePhase, GameState } from "../../../shared/types";

const getAliveIds = (state: GameState): string[] =>
  Object.values(state.players)
    .filter((player) => player.isAlive)
    .map((player) => player.id);

export const enforceGameOver = (state: GameState): GameState => {
  if (!state.isStarted || state.isGameOver) {
    return state;
  }
  const aliveIds = getAliveIds(state);
  if (aliveIds.length > 1) {
    return state;
  }
  const winnerPlayerId = aliveIds[0] ?? "";

  return {
    ...state,
    isStarted: false,
    isGameOver: true,
    winnerPlayerId,
    isPaused: false,
    pausedPlayerId: "",
    currentPhase: GamePhase.WAITING_FOR_PLAYERS,
    pendingAction: null,
    pendingDiscardPlayerId: "",
  };
};
