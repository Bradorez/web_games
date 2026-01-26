import { ActionType, GamePhase, GameState } from "../../../shared/types";
import {
  ACTION_CLAIMS,
  advanceTurn,
  applyCoins,
} from "./challengeHelpers";
import { GameAction } from "./actionTypes";
import { LossHandler, createPendingAction } from "./challengeResolution";

const ASSASSINATE_COST = 3;
const COUP_COST = 7;

const getDefaultTargetId = (
  state: GameState,
  sourcePlayerId: string
): string => {
  const candidates = Object.values(state.players)
    .filter((player) => player.id !== sourcePlayerId && player.isAlive)
    .map((player) => player.id);
  return candidates[0] ?? "";
};

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
    const targetPlayerId =
      action.targetPlayerId ?? getDefaultTargetId(state, sourcePlayerId);
    if (!targetPlayerId) {
      return state;
    }
    const sourcePlayer = state.players[sourcePlayerId];
    if (!sourcePlayer || sourcePlayer.coins < COUP_COST) {
      return state;
    }

    const paidState = applyCoins(state, sourcePlayerId, -COUP_COST);
    const pendingAction = createPendingAction(
      { ...action, targetPlayerId },
      sourcePlayerId
    );
    const afterLoss = applyLoss(paidState, pendingAction.targetPlayerId);
    if (afterLoss.currentPhase === GamePhase.LOSE_CARD_WINDOW) {
      return { ...afterLoss, pendingAction };
    }
    return advanceTurn(afterLoss, sourcePlayerId);
  }

  if (ACTION_CLAIMS[action.type]) {
    const needsTarget =
      action.type === ActionType.Steal ||
      action.type === ActionType.Assassinate;
    const targetPlayerId = needsTarget
      ? action.targetPlayerId ?? getDefaultTargetId(state, sourcePlayerId)
      : action.targetPlayerId;
    if (needsTarget && !targetPlayerId) {
      return state;
    }

    if (action.type === ActionType.Assassinate) {
      const sourcePlayer = state.players[sourcePlayerId];
      if (!sourcePlayer || sourcePlayer.coins < ASSASSINATE_COST) {
        return state;
      }
      const paidState = applyCoins(state, sourcePlayerId, -ASSASSINATE_COST);
      return {
        ...paidState,
        currentPhase: GamePhase.CHALLENGE_WINDOW,
        pendingAction: createPendingAction(
          { ...action, targetPlayerId },
          sourcePlayerId
        ),
        pendingDiscardPlayerId: "",
      };
    }

    return {
      ...state,
      currentPhase: GamePhase.CHALLENGE_WINDOW,
      pendingAction: createPendingAction(
        { ...action, targetPlayerId },
        sourcePlayerId
      ),
      pendingDiscardPlayerId: "",
    };
  }

  return state;
};
