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
import { appendLog } from "./log";

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
        appendLog(applyCoins(state, pendingAction.sourcePlayerId, 2), `${state.players[pendingAction.sourcePlayerId]?.name ?? "Player"} gains 2 coins (Foreign Aid).`),
        pendingAction.sourcePlayerId
      );
    case ActionType.Tax:
      return advanceTurn(
        appendLog(applyCoins(state, pendingAction.sourcePlayerId, 3), `${state.players[pendingAction.sourcePlayerId]?.name ?? "Player"} gains 3 coins (Tax).`),
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
        appendLog(applyCoins(debitState, pendingAction.sourcePlayerId, amount), `${state.players[pendingAction.sourcePlayerId]?.name ?? "Player"} steals ${amount} coins from ${target?.name ?? "a player"}.`),
        pendingAction.sourcePlayerId
      );
    }
    case ActionType.Assassinate:
    case ActionType.Coup: {
      const actionLabel = pendingAction.actionType === ActionType.Coup ? "Coup" : "Assassinate";
      const afterLoss = applyLoss(appendLog(state, `${state.players[pendingAction.sourcePlayerId]?.name ?? "Player"} resolves ${actionLabel} on ${state.players[pendingAction.targetPlayerId]?.name ?? "a player"}.`), pendingAction.targetPlayerId);
      if (afterLoss.currentPhase === GamePhase.LOSE_CARD_WINDOW) {
        return { ...afterLoss, pendingAction };
      }
      return advanceTurn(afterLoss, pendingAction.sourcePlayerId);
    }
    case ActionType.Exchange: {
      const exchangedState = appendLog(exchangeCards(
        state,
        pendingAction.sourcePlayerId,
        2
      ), `${state.players[pendingAction.sourcePlayerId]?.name ?? "Player"} exchanges cards.`);
      return advanceTurn(exchangedState, pendingAction.sourcePlayerId);
    }
    default:
      return advanceTurn(state, pendingAction.sourcePlayerId);
  }
};
