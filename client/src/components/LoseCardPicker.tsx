import { Card } from "../../../shared/types";
import { Card as CardView } from "./Card";

interface LoseCardPickerProps {
  hand: Card[];
  onSelect: (cardId: string) => void;
}

export const LoseCardPicker = ({ hand, onSelect }: LoseCardPickerProps): JSX.Element => (
  <div className="rounded-xl border border-amber-400/60 bg-amber-200/10 p-4 text-sm text-amber-200">
    <div>Select a card to lose:</div>
    <div className="mt-3 flex flex-wrap gap-2">
      {hand.map((card) => (
        <CardView key={card.id} id={card.id} type={card.type} isFaceUp={true} onClick={() => onSelect(card.id)} />
      ))}
    </div>
  </div>
);
