import { Card } from "../../../shared/types";

interface DeckInspectorProps {
  deck: Card[];
}

export const DeckInspector = ({ deck }: DeckInspectorProps): JSX.Element => (
  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Deck Order (Debug)</div>
    <div className="mt-3 flex max-h-64 flex-col gap-2 overflow-y-auto text-sm text-slate-200">
      {deck.length === 0 && <div className="text-slate-500">Deck hidden or empty.</div>}
      {deck.map((card, index) => (
        <div key={card.id} className="rounded-lg bg-slate-950/40 px-3 py-2">
          {index + 1}. {card.type}
        </div>
      ))}
    </div>
  </div>
);
