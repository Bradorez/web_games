import { Card, GameState, Player } from "../../../shared/types";

const drawFromDeck = (deck: Card[], count: number): { drawn: Card[]; deck: Card[] } => ({
  drawn: deck.slice(0, count),
  deck: deck.slice(count),
});

export const dealInitialHands = (
  state: GameState,
  handSize = 2
): GameState => {
  let deck = [...state.deck];
  const players: Record<string, Player> = {};

  Object.keys(state.players).forEach((playerId) => {
    const player = state.players[playerId];
    const { drawn, deck: remaining } = drawFromDeck(deck, handSize);
    deck = remaining;
    const hand = drawn;
    players[playerId] = {
      ...player,
      hand,
      lives: hand.length,
      isAlive: hand.length > 0,
    };
  });

  return {
    ...state,
    deck,
    players,
  };
};
