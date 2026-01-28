import { ActionType, GamePhase, GameState } from "../../shared/types";
import { handleExchangeChoice, handlePass } from "../engine/challenge";
import { handleAction } from "../engine/game";
import { GameAction } from "../engine/actionTypes";
import { getEligiblePassers } from "../engine/challengeHelpers";
import { shuffle } from "../engine/deck";

const MAX_AI_STEPS = 20;
const ASSASSINATE_COST = 3;
const COUP_COST = 7;

const getAliveOpponents = (state: GameState, playerId: string): string[] =>
  Object.values(state.players)
    .filter((player) => player.id !== playerId && player.isAlive)
    .map((player) => player.id);

const chooseRandom = <T,>(items: T[]): T | null => {
  if (items.length === 0) {
    return null;
  }
  const index = Math.floor(Math.random() * items.length);
  return items[index] ?? null;
};

const chooseAiAction = (
  state: GameState,
  playerId: string
): GameAction | null => {
  const player = state.players[playerId];
  if (!player) {
    return null;
  }
  const opponents = getAliveOpponents(state, playerId);
  const hasTargets = opponents.length > 0;
  const options: ActionType[] = [
    ActionType.Income,
    ActionType.ForeignAid,
    ActionType.Tax,
    ActionType.Exchange,
  ];

  if (hasTargets) {
    options.push(ActionType.Steal);
  }
  if (hasTargets && player.coins >= ASSASSINATE_COST) {
    options.push(ActionType.Assassinate);
  }
  if (hasTargets && player.coins >= COUP_COST) {
    options.push(ActionType.Coup);
  }

  const chosen = chooseRandom(options);
  if (!chosen) {
    return null;
  }

  const targetPlayerId = hasTargets ? chooseRandom(opponents) ?? "" : "";
  return {
    type: chosen,
    sourcePlayerId: playerId,
    targetPlayerId,
  };
};

const applyAiPasses = (state: GameState): GameState => {
  const pending = state.pendingAction;
  if (!pending) {
    return state;
  }

  const eligible = getEligiblePassers(state, pending);
  let updatedState = state;

  for (const playerId of eligible) {
    const player = updatedState.players[playerId];
    if (!player?.isBot) {
      continue;
    }
    if (updatedState.pendingAction?.passedPlayerIds.includes(playerId)) {
      continue;
    }
    updatedState = handlePass(updatedState, playerId);
    if (!updatedState.pendingAction) {
      break;
    }
  }

  return updatedState;
};

export const runAiTurn = (state: GameState): GameState => {
  let current = state;
  for (let step = 0; step < MAX_AI_STEPS; step += 1) {
    if (!current.isStarted || current.isPaused || current.isGameOver) {
      break;
    }

    if (
      current.currentPhase === GamePhase.CHALLENGE_WINDOW ||
      current.currentPhase === GamePhase.BLOCK_WINDOW ||
      current.currentPhase === GamePhase.BLOCK_CHALLENGE_WINDOW
    ) {
      const next = applyAiPasses(current);
      if (next === current) {
        break;
      }
      current = next;
      continue;
    }

    if (current.currentPhase === GamePhase.ACTION_DECLARATION) {
      const currentPlayer = current.players[current.turnPlayerId];
      if (!currentPlayer?.isBot) {
        break;
      }
      const action = chooseAiAction(current, currentPlayer.id);
      if (!action) {
        break;
      }
      const next = handleAction(current, action);
      if (next === current) {
        break;
      }
      current = next;
      continue;
    }

    if (current.currentPhase === GamePhase.EXCHANGE_WINDOW && current.pendingExchange) {
      const pending = current.pendingExchange;
      const exchangePlayer = current.players[pending.playerId];
      if (!exchangePlayer?.isBot) {
        break;
      }
      const shuffled = shuffle(pending.options);
      const keepCardIds = shuffled.slice(0, pending.keepCount).map((card) => card.id);
      const next = handleExchangeChoice(current, pending.playerId, keepCardIds);
      if (next === current) {
        break;
      }
      current = next;
      continue;
    }

    break;
  }

  return current;
};
