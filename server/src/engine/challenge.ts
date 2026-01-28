import { GamePhase, GameState, Player } from "../../../shared/types";
import { handleChallengeFlow } from "./challengeFlow";
import { initiateActionFlow } from "./challengeInitiateFlow";
import { updatePlayer } from "./challengeHelpers";
import { GameAction } from "./actionTypes";
import { handlePassFlow } from "./challengePassFlow";
import { enforceGameOver } from "./gameOutcome";

const applyLossIfForced = (state: GameState, playerId: string): GameState => {
  const player = state.players[playerId];
  if (!player) {
    return state;
  }

  const remainingLives = Math.max(0, player.lives - 1);
  const updatedPlayer: Player = {
    ...player,
    lives: remainingLives,
    isAlive: remainingLives > 0,
  };
  return updatePlayer(state, playerId, updatedPlayer);
};

export const initiateAction = (state: GameState, action: GameAction): GameState =>
  enforceGameOver(initiateActionFlow(state, action, applyLossIfForced));

export const handleChallenge = (
  state: GameState,
  challengerId: string
): GameState =>
  enforceGameOver(handleChallengeFlow(state, challengerId, applyLossIfForced));

export const handlePass = (state: GameState, playerId: string): GameState =>
  enforceGameOver(handlePassFlow(state, playerId, applyLossIfForced));

export type { GameAction } from "./actionTypes";
