import {
  ActionType,
  CardType,
  GamePhase,
  GameState,
  PendingAction,
} from "../../shared/types";
import {
  ACTION_CLAIMS,
  advanceTurn,
  applyCoins,
  applyPotCoins,
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
        appendLog(applyPotCoins(state, pendingAction.sourcePlayerId, 2), `${state.players[pendingAction.sourcePlayerId]?.name ?? "Player"} gains 2 coins (Foreign Aid).`),
        pendingAction.sourcePlayerId
      );
    case ActionType.Tax:
      return advanceTurn(
        appendLog(applyPotCoins(state, pendingAction.sourcePlayerId, 3), `${state.players[pendingAction.sourcePlayerId]?.name ?? "Player"} gains 3 coins (Tax).`),
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
        return { ...afterLoss, pendingAction, pendingResolution: { kind: "advance_turn", sourcePlayerId: pendingAction.sourcePlayerId } };
      }
      return advanceTurn(afterLoss, pendingAction.sourcePlayerId);
    }
    case ActionType.Exchange: {
      const player = state.players[pendingAction.sourcePlayerId];
      if (!player) {
        return state;
      }
      const drawCount = Math.min(2, state.deck.length);
      const drawn = state.deck.slice(0, drawCount);
      const remainingDeck = state.deck.slice(drawCount);
      return {
        ...appendLog(state, `${player.name} begins an exchange.`),
        deck: remainingDeck,
        currentPhase: GamePhase.EXCHANGE_WINDOW,
        pendingAction: null,
        pendingDiscardPlayerId: "",
        pendingExchange: {
          playerId: player.id,
          options: [...player.hand, ...drawn],
          keepCount: player.hand.length,
        },
      };
    }
    default:
      return advanceTurn(state, pendingAction.sourcePlayerId);
  }
};

export const applyExchangeChoice = (
  state: GameState,
  playerId: string,
  keepCardIds: string[]
): GameState => {
  if (state.currentPhase !== GamePhase.EXCHANGE_WINDOW || !state.pendingExchange) {
    return state;
  }
  const pending = state.pendingExchange;
  if (pending.playerId !== playerId) {
    return state;
  }
  if (keepCardIds.length !== pending.keepCount) {
    return state;
  }
  if (new Set(keepCardIds).size !== keepCardIds.length) {
    return state;
  }

  const optionMap = new Map(pending.options.map((card) => [card.id, card]));
  const kept = keepCardIds.map((id) => optionMap.get(id)).filter(Boolean) as typeof pending.options;
  if (kept.length !== pending.keepCount) {
    return state;
  }
  const keptIds = new Set(kept.map((card) => card.id));
  const returned = pending.options.filter((card) => !keptIds.has(card.id));
  const player = state.players[playerId];
  if (!player) {
    return state;
  }

  const updatedState: GameState = {
    ...state,
    deck: [...state.deck, ...returned],
    pendingExchange: null,
    players: {
      ...state.players,
      [playerId]: { ...player, hand: kept, lives: kept.length, isAlive: kept.length > 0 },
    },
  };

  return advanceTurn(
    appendLog(updatedState, `${player.name} completes the exchange.`),
    playerId
  );
};
