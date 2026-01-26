import { Card, CardType, GameState, Player } from "../../../shared/types";

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
  const maskedPlayers: Record<string, Player> = {};
  const pendingAction = state.pendingAction
    ? {
        ...state.pendingAction,
        passedPlayerIds: [...state.pendingAction.passedPlayerIds],
      }
    : null;

  for (const [playerId, player] of Object.entries(state.players)) {
    maskedPlayers[playerId] = {
      ...player,
      hand: maskHand(playerId, player.hand, requestingPlayerId),
      graveyard: player.graveyard.map((card) => ({ ...card })),
    };
  }

  return {
    ...state,
    deck: [],
    players: maskedPlayers,
    pendingAction,
  };
};
