import { Card, CardType } from "../../../shared/types";

const COPIES_PER_TYPE = 3;
const DECK_CARD_TYPES: CardType[] = [
  CardType.Duke,
  CardType.Assassin,
  CardType.Captain,
  CardType.Ambassador,
  CardType.Contessa,
];

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const type of DECK_CARD_TYPES) {
    for (let i = 0; i < COPIES_PER_TYPE; i += 1) {
      deck.push({
        id: `${type}-${i + 1}`,
        type,
        isRevealed: false,
      });
    }
  }

  return deck;
};

export const shuffle = (deck: Card[]): Card[] => {
  const shuffled = [...deck];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
};
