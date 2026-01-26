import { GamePhase, GameState } from "../../../shared/types";
import {
  advanceTurn,
  swapClaimedCard,
} from "./challengeHelpers";
import {
  LossHandler,
  resolveAction,
} from "./challengeResolution";

export const handleChallengeFlow = (
  state: GameState,
  challengerId: string,
  applyLoss: LossHandler
): GameState => {
  const pendingAction = state.pendingAction;
  if (!pendingAction) {
    return state;
  }

  const challengedId =
    state.currentPhase === GamePhase.BLOCK_CHALLENGE_WINDOW &&
    pendingAction.blockerId
      ? pendingAction.blockerId
      : pendingAction.sourcePlayerId;
  const challengedPlayer = state.players[challengedId];
  const challenger = state.players[challengerId];

  if (!challengedPlayer || !challenger) {
    return state;
  }

  const hasCard = challengedPlayer.hand.some(
    (card) => card.type === pendingAction.claimedCard
  );

  if (hasCard) {
    const swappedState = swapClaimedCard(
      state,
      challengedId,
      pendingAction.claimedCard
    );
    const afterLoss = applyLoss(swappedState, challengerId);
    if (afterLoss.currentPhase === GamePhase.LOSE_CARD_WINDOW) {
      return { ...afterLoss, pendingAction };
    }
    if (state.currentPhase === GamePhase.BLOCK_CHALLENGE_WINDOW) {
      return advanceTurn(afterLoss, pendingAction.sourcePlayerId);
    }
    return resolveAction(afterLoss, pendingAction, applyLoss);
  }

  const afterLoss = applyLoss(state, challengedId);
  if (afterLoss.currentPhase === GamePhase.LOSE_CARD_WINDOW) {
    return { ...afterLoss, pendingAction };
  }

  if (state.currentPhase === GamePhase.BLOCK_CHALLENGE_WINDOW) {
    return resolveAction(afterLoss, pendingAction, applyLoss);
  }

  return advanceTurn(afterLoss, pendingAction.sourcePlayerId);
};
