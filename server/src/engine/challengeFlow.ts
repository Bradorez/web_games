import { GamePhase, GameState } from "../../shared/types";
import {
  BLOCKABLE_ACTIONS,
  advanceTurn,
  swapClaimedCard,
} from "./challengeHelpers";
import {
  LossHandler,
  CHALLENGE_DURATION_MS,
  resolveAction,
} from "./challengeResolution";
import { appendLog } from "./log";

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
    const loggedState = appendLog(state, `${challenger.name} challenges ${challengedPlayer.name}; ${challengedPlayer.name} reveals a card and draws a replacement.`);
    const swappedState = swapClaimedCard(
      loggedState,
      challengedId,
      pendingAction.claimedCard
    );
    const afterReveal = {
      ...swappedState,
      lastReveal: {
        playerId: challengedId,
        cardType: pendingAction.claimedCard,
        timestamp: Date.now(),
      },
    };
    const afterLoss = applyLoss(afterReveal, challengerId);
    if (afterLoss.currentPhase === GamePhase.LOSE_CARD_WINDOW) {
      const kind =
        state.currentPhase === GamePhase.BLOCK_CHALLENGE_WINDOW
          ? "advance_turn"
          : BLOCKABLE_ACTIONS.has(pendingAction.actionType)
            ? "open_block_window"
            : "resolve_action";
      return { ...afterLoss, pendingAction, pendingResolution: { kind, sourcePlayerId: pendingAction.sourcePlayerId } };
    }
    if (state.currentPhase === GamePhase.BLOCK_CHALLENGE_WINDOW) {
      return advanceTurn(afterLoss, pendingAction.sourcePlayerId);
    }
    if (BLOCKABLE_ACTIONS.has(pendingAction.actionType)) {
      return {
        ...afterLoss,
        currentPhase: GamePhase.BLOCK_WINDOW,
        pendingAction: {
          ...pendingAction,
          blockerId: "",
          passedPlayerIds: [],
          timerExpiresAt: Date.now() + CHALLENGE_DURATION_MS,
        },
      };
    }
    return resolveAction(afterLoss, pendingAction, applyLoss);
  }

  const afterLoss = applyLoss(appendLog(state, `${challenger.name} challenges ${challengedPlayer.name} successfully.`), challengedId);
  if (afterLoss.currentPhase === GamePhase.LOSE_CARD_WINDOW) {
    const kind = state.currentPhase === GamePhase.BLOCK_CHALLENGE_WINDOW ? "resolve_action" : "advance_turn";
    return { ...afterLoss, pendingAction, pendingResolution: { kind, sourcePlayerId: pendingAction.sourcePlayerId } };
  }

  if (state.currentPhase === GamePhase.BLOCK_CHALLENGE_WINDOW) {
    return resolveAction(afterLoss, pendingAction, applyLoss);
  }

  return advanceTurn(afterLoss, pendingAction.sourcePlayerId);
};
