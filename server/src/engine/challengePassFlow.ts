import { GamePhase, GameState } from "../../../shared/types";
import {
  BLOCKABLE_ACTIONS,
  advanceTurn,
  clearPending,
  getEligiblePassers,
} from "./challengeHelpers";
import {
  CHALLENGE_DURATION_MS,
  LossHandler,
  resolveAction,
} from "./challengeResolution";
import { appendLog } from "./log";

export const handlePassFlow = (
  state: GameState,
  playerId: string,
  applyLoss: LossHandler
): GameState => {
  const pendingAction = state.pendingAction;
  if (!pendingAction) {
    return state;
  }

  if (pendingAction.passedPlayerIds.includes(playerId)) {
    return state;
  }
  const passed = [...pendingAction.passedPlayerIds, playerId];
  const updatedPending = { ...pendingAction, passedPlayerIds: passed };
  const updatedState = appendLog({ ...state, pendingAction: updatedPending }, `${state.players[playerId]?.name ?? "Player"} passes.`);

  const eligibleIds = getEligiblePassers(state, pendingAction);
  const allPassed = eligibleIds.every((id) => passed.includes(id));
  if (!allPassed) {
    return updatedState;
  }

  if (state.currentPhase === GamePhase.CHALLENGE_WINDOW) {
    if (BLOCKABLE_ACTIONS.has(pendingAction.actionType)) {
      return {
        ...updatedState,
        currentPhase: GamePhase.BLOCK_WINDOW,
        pendingAction: {
          ...updatedPending,
          passedPlayerIds: [],
          timerExpiresAt: Date.now() + CHALLENGE_DURATION_MS,
        },
      };
    }
    return resolveAction(clearPending(updatedState), pendingAction, applyLoss);
  }

  if (state.currentPhase === GamePhase.BLOCK_WINDOW) {
    return resolveAction(clearPending(updatedState), pendingAction, applyLoss);
  }

  if (state.currentPhase === GamePhase.BLOCK_CHALLENGE_WINDOW) {
    return advanceTurn(clearPending(updatedState), pendingAction.sourcePlayerId);
  }

  return updatedState;
};
