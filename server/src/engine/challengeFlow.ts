import {
  ActionType,
  GamePhase,
  GameState,
} from "../../../shared/types";
import {
  ACTION_CLAIMS,
  advanceTurn,
  applyCoins,
  swapClaimedCard,
} from "./challengeHelpers";
import { GameAction } from "./actionTypes";
import {
  LossHandler,
  createPendingAction,
  resolveAction,
} from "./challengeResolution";

export const initiateActionFlow = (
  state: GameState,
  action: GameAction,
  applyLoss: LossHandler
): GameState => {
  const sourcePlayerId = action.sourcePlayerId ?? state.turnPlayerId;
  if (!state.players[sourcePlayerId]) {
    return state;
  }

  if (action.type === ActionType.Income) {
    return advanceTurn(applyCoins(state, sourcePlayerId, 1), sourcePlayerId);
  }

  if (action.type === ActionType.ForeignAid) {
    return {
      ...state,
      currentPhase: GamePhase.BLOCK_WINDOW,
      pendingAction: createPendingAction(action, sourcePlayerId),
      pendingDiscardPlayerId: "",
    };
  }

  if (action.type === ActionType.Coup) {
    const pendingAction = createPendingAction(action, sourcePlayerId);
    const afterLoss = applyLoss(state, pendingAction.targetPlayerId);
    if (afterLoss.currentPhase === GamePhase.LOSE_CARD_WINDOW) {
      return { ...afterLoss, pendingAction };
    }
    return advanceTurn(afterLoss, sourcePlayerId);
  }

  if (ACTION_CLAIMS[action.type]) {
    return {
      ...state,
      currentPhase: GamePhase.CHALLENGE_WINDOW,
      pendingAction: createPendingAction(action, sourcePlayerId),
      pendingDiscardPlayerId: "",
    };
  }

  return state;
};

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
