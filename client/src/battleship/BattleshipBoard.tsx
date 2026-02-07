import { BattleshipPoint } from "../../../shared/types";

interface BattleshipBoardProps {
  title: string;
  ships: BattleshipPoint[];
  shots: BattleshipPoint[];
  highlightShots?: BattleshipPoint[];
  onCellClick?: (point: BattleshipPoint) => void;
  interactive?: boolean;
}

const size = 10;

const hasPoint = (list: BattleshipPoint[], point: BattleshipPoint): boolean =>
  list.some((p) => p.x === point.x && p.y === point.y);

export const BattleshipBoard = ({
  title,
  ships,
  shots,
  highlightShots = [],
  onCellClick,
  interactive = false,
}: BattleshipBoardProps): JSX.Element => {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm font-semibold text-slate-200">{title}</div>
      <div className="grid grid-cols-10 gap-1 rounded-xl border border-slate-800 bg-slate-900/70 p-2">
        {Array.from({ length: size * size }).map((_, index) => {
          const x = index % size;
          const y = Math.floor(index / size);
          const point = { x, y };
          const isShip = hasPoint(ships, point);
          const isShot = hasPoint(shots, point);
          const isHighlight = hasPoint(highlightShots, point);
          const cellClass = isShot
            ? isShip
              ? "bg-rose-500/80"
              : "bg-slate-700/80"
            : isShip
              ? "bg-emerald-500/40"
              : "bg-slate-800/60";
          return (
            <button
              key={`${x}-${y}`}
              className={`h-7 w-7 rounded-md transition ${cellClass} ${interactive ? "hover:bg-emerald-400/40" : ""} ${isHighlight ? "ring-2 ring-amber-300" : ""}`}
              onClick={() => onCellClick?.(point)}
              type="button"
              disabled={!interactive}
            />
          );
        })}
      </div>
    </div>
  );
};
