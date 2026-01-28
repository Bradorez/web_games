import { GameLogEntry } from "../../../shared/types";

interface GameLogProps {
  entries: GameLogEntry[];
}

export const GameLog = ({ entries }: GameLogProps): JSX.Element => {
  const visible = entries.slice(-12);
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Game Log</div>
      <div className="mt-3 flex max-h-60 flex-col gap-2 overflow-y-auto text-sm text-slate-200">
        {visible.length === 0 && <div className="text-slate-500">No events yet.</div>}
        {visible.map((entry) => (
          <div key={entry.id} className="rounded-lg bg-slate-950/40 px-3 py-2">
            {entry.message}
          </div>
        ))}
      </div>
    </div>
  );
};
