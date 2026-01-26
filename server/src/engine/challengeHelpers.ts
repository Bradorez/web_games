import {
  ActionType,
  CardType,
  GamePhase,
  GameState,
  PendingAction,
  Player,
} from "../../../shared/types";
import { shuffle } from "./deck";
import { modifyCoins } from "./player";
import { getNextTurnPlayerId } from "./turn";

export const ACTION_CLAIMS: Partial<Record<ActionType, CardType>> = {
  [ActionType.Tax]: CardType.Duke,
  [ActionType.Assassinate]: CardType.Assassin,
  [ActionType.Exchange]: CardType.Ambassador,
  [ActionType.Steal]: CardType.Captain,
};

export const BLOCKABLE_ACTIONS = new Set<ActionType>([
  ActionType.ForeignAid,
  ActionType.Assassinate,
  ActionType.Steal,
]);

export const clearPending = (state: GameState): GameState => ({
  ...state,
  pendingAction: null,
  pendingDiscardPlayerId: "",
});

export const updatePlayer = (
  state: GameState,
  playerId: string,
  player: Player
): GameState => ({
  ...state,
  players: {
    ...state.players,
    [playerId]: player,
  },
});

export const advanceTurn = (
  state: GameState,
  currentPlayerId: string
): GameState => ({
  ...clearPending(state),
  currentPhase: GamePhase.ACTION_DECLARATION,
  turnPlayerId: getNextTurnPlayerId(state.players, currentPlayerId),
});

export const applyCoins = (
  state: GameState,
  playerId: string,
  amount: number
): GameState => {
  const player = state.players[playerId];
  if (!player) {
    return state;
  }

  return updatePlayer(state, playerId, modifyCoins(player, amount));
};

export const swapClaimedCard = (
  state: GameState,
  playerId: string,
  claimedCard: CardType
): GameState => {
  const player = state.players[playerId];
  if (!player) {
    return state;
  }

  const index = player.hand.findIndex((card) => card.type === claimedCard);
  if (index === -1) {
    return state;
  }

  const claimed = player.hand[index];
  const remainingHand = player.hand.filter((_, i) => i !== index);
  const [replacement, ...restDeck] = state.deck;

  if (!replacement) {
    return updatePlayer(state, playerId, {
      ...player,
      hand: [...remainingHand, claimed],
    });
  }

  const refreshedHand = [...remainingHand, replacement];
  const refreshedDeck = shuffle([...restDeck, { ...claimed, isRevealed: false }]);

  return updatePlayer(
    { ...state, deck: refreshedDeck },
    playerId,
    { ...player, hand: refreshedHand }
  );
};

export const exchangeCards = (
  state: GameState,
  playerId: string,
  drawCount: number
): GameState => {
  const player = state.players[playerId];
  if (!player) {
    return state;
  }

  const drawTotal = Math.min(drawCount, state.deck.length);
  const drawn = state.deck.slice(0, drawTotal);
  const remainingDeck = state.deck.slice(drawTotal);
  const combined = [...player.hand, ...drawn];
  if (combined.length === 0) {
    return state;
  }

  const keepCount = player.hand.length;
  const shuffled = shuffle(combined);
  const nextHand = shuffled.slice(0, keepCount);
  const returned = shuffled.slice(keepCount);

  return updatePlayer(
    { ...state, deck: [...remainingDeck, ...returned] },
    playerId,
    { ...player, hand: nextHand }
  );
};

export const getEligiblePassers = (
  state: GameState,
  pendingAction: PendingAction
): string[] => {
  const aliveIds = Object.values(state.players)
    .filter((player) => player.isAlive)
    .map((player) => player.id);
  const excludedId =
    state.currentPhase === GamePhase.BLOCK_CHALLENGE_WINDOW &&
    pendingAction.blockerId
      ? pendingAction.blockerId
      : pendingAction.sourcePlayerId;

  return aliveIds.filter((id) => id !== excludedId);
};
