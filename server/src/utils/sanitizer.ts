import { Card, CardType, GameState, Player } from "../../shared/types";

const maskHand = (
  playerId: string,
  hand: Card[],
  requestingPlayerId: string
): Card[] => {
  if (playerId === requestingPlayerId) {
    return hand.map((card) => ({ ...card }));
  }

  return hand.map((_, index) => ({
    id: `masked-${playerId}-${index + 1}`,
    type: CardType.Unknown,
    isRevealed: false,
  }));
};

export const maskState = (
  state: GameState,
  requestingPlayerId: string
): GameState => {
  const showDeck = process.env.DEBUG_DECK === "true";
  const maskedPlayers: Record<string, Player> = {};
  const pendingAction = state.pendingAction
    ? {
        ...state.pendingAction,
        passedPlayerIds: [...state.pendingAction.passedPlayerIds],
      }
    : null;
  const pendingExchange =
    state.pendingExchange && state.pendingExchange.playerId === requestingPlayerId
      ? {
          ...state.pendingExchange,
          options: state.pendingExchange.options.map((card) => ({ ...card })),
        }
      : null;
  const gameLog = state.gameLog.map((entry) => ({ ...entry }));

  for (const [playerId, player] of Object.entries(state.players)) {
    maskedPlayers[playerId] = {
      ...player,
      hand: maskHand(playerId, player.hand, requestingPlayerId),
      graveyard: player.graveyard.map((card) => ({ ...card })),
    };
  }

  return {
    ...state,
    deck: showDeck ? state.deck.map((card) => ({ ...card })) : [],
    players: maskedPlayers,
    pendingAction,
    pendingExchange,
    gameLog,
  };
};
