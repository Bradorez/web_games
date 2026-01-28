import { GamePhase, GameState } from "../../../shared/types";
import { createPlayer } from "../engine/player";
import { initializeGame } from "../engine/game";

const pickHostId = (state: GameState, playerIds: string[]): string =>
  state.hostPlayerId && playerIds.includes(state.hostPlayerId)
    ? state.hostPlayerId
    : playerIds[0] ?? "";

export const restartGameState = (state: GameState): GameState => {
  const playerIds = Object.keys(state.players);
  const baseState = initializeGame(playerIds);
  const hostPlayerId = pickHostId(state, playerIds);
  const players: GameState["players"] = {};

  playerIds.forEach((playerId) => {
    const existing = state.players[playerId];
    const fresh = createPlayer(playerId, existing?.name ?? playerId, existing?.isBot ?? false);
    players[playerId] = {
      ...fresh,
      isConnected: existing?.isConnected ?? true,
    };
  });

  const pausedPlayer = Object.values(players).find(
    (player) => player.isAlive && !player.isConnected
  );

  return {
    ...baseState,
    players,
    hostPlayerId,
    turnPlayerId: hostPlayerId || playerIds[0] || "",
    isStarted: true,
    isGameOver: false,
    winnerPlayerId: "",
    currentPhase: GamePhase.ACTION_DECLARATION,
    isPaused: Boolean(pausedPlayer),
    pausedPlayerId: pausedPlayer?.id ?? "",
    gameLog: [],
  };
};
