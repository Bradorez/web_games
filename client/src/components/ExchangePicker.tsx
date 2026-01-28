import { useMemo, useState } from "react";
import { Card as CardType } from "../../../shared/types";
import { Card } from "./Card";

interface ExchangePickerProps {
  options: CardType[];
  keepCount: number;
  onConfirm: (keepCardIds: string[]) => void;
}

export const ExchangePicker = ({
  options,
  keepCount,
  onConfirm,
}: ExchangePickerProps): JSX.Element => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const toggle = (cardId: string) => {
    setSelectedIds((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
    );
  };
  const canConfirm = selectedIds.length === keepCount;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="text-sm text-slate-300">Choose {keepCount} card(s) to keep:</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((card) => {
          const isSelected = selectedSet.has(card.id);
          return (
            <div key={card.id} className={isSelected ? "ring-2 ring-emerald-400 rounded-lg" : ""}>
              <Card id={card.id} type={card.type} isFaceUp={true} onClick={() => toggle(card.id)} />
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
        <span>{selectedIds.length}/{keepCount} selected</span>
        <button className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide ${canConfirm ? "bg-emerald-400 text-slate-900" : "bg-slate-700 text-slate-300 cursor-not-allowed"}`} type="button" disabled={!canConfirm} onClick={() => onConfirm(selectedIds)}>Confirm</button>
      </div>
    </div>
  );
};
