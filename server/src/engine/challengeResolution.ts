import {
  ActionType,
  CardType,
  GamePhase,
  GameState,
  PendingAction,
} from "../../../shared/types";
import {
  ACTION_CLAIMS,
  advanceTurn,
  applyCoins,
  exchangeCards,
} from "./challengeHelpers";
import { GameAction } from "./actionTypes";

export type LossHandler = (state: GameState, playerId: string) => GameState;

export const CHALLENGE_DURATION_MS = 10_000;

export const createPendingAction = (
  action: GameAction,
  sourcePlayerId: string
): PendingAction => ({
  sourcePlayerId,
  targetPlayerId: action.targetPlayerId ?? "",
  actionType: action.type,
  timerExpiresAt: Date.now() + CHALLENGE_DURATION_MS,
  blockerId: "",
  claimedCard: ACTION_CLAIMS[action.type] ?? CardType.Unknown,
  passedPlayerIds: [],
});

export const resolveAction = (
  state: GameState,
  pendingAction: PendingAction,
  applyLoss: LossHandler
): GameState => {
  switch (pendingAction.actionType) {
    case ActionType.ForeignAid:
      return advanceTurn(
        applyCoins(state, pendingAction.sourcePlayerId, 2),
        pendingAction.sourcePlayerId
      );
    case ActionType.Tax:
      return advanceTurn(
        applyCoins(state, pendingAction.sourcePlayerId, 3),
        pendingAction.sourcePlayerId
      );
    case ActionType.Steal: {
      const target = state.players[pendingAction.targetPlayerId];
      const amount = target ? Math.min(2, target.coins) : 0;
      const debitState = target
        ? {
            ...state,
            players: {
              ...state.players,
              [target.id]: { ...target, coins: target.coins - amount },
            },
          }
        : state;
      return advanceTurn(
        applyCoins(debitState, pendingAction.sourcePlayerId, amount),
        pendingAction.sourcePlayerId
      );
    }
    case ActionType.Assassinate:
    case ActionType.Coup: {
      const afterLoss = applyLoss(state, pendingAction.targetPlayerId);
      if (afterLoss.currentPhase === GamePhase.LOSE_CARD_WINDOW) {
        return { ...afterLoss, pendingAction };
      }
      return advanceTurn(afterLoss, pendingAction.sourcePlayerId);
    }
    case ActionType.Exchange: {
      const exchangedState = exchangeCards(
        state,
        pendingAction.sourcePlayerId,
        2
      );
      return advanceTurn(exchangedState, pendingAction.sourcePlayerId);
    }
    default:
      return advanceTurn(state, pendingAction.sourcePlayerId);
  }
};
