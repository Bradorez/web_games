import { useEffect, useMemo, useState } from "react";
import { BattleshipPhase, BattleshipPoint, BattleshipShip, BattleshipState } from "../../../shared/types";
import { BattleshipBoard } from "./BattleshipBoard";

const shipSizes = [5, 4, 3, 3, 2];

interface BattleshipGameProps {
  state: BattleshipState;
  localPlayerId: string;
  onPlaceShips: (ships: BattleshipShip[]) => void;
  onFire: (point: BattleshipPoint) => void;
  onRestart: () => void;
  onLeave: () => void;
}

const buildShip = (size: number): BattleshipShip => ({
  id: `${size}-${Math.random().toString(16).slice(2, 6)}`,
  size,
  positions: [],
  hits: [],
  isSunk: false,
});

const inside = (point: BattleshipPoint): boolean =>
  point.x >= 0 && point.x < 10 && point.y >= 0 && point.y < 10;

const overlaps = (ships: BattleshipShip[], point: BattleshipPoint): boolean =>
  ships.some((ship) => ship.positions.some((pos) => pos.x === point.x && pos.y === point.y));

export const BattleshipGame = ({
  state,
  localPlayerId,
  onPlaceShips,
  onFire,
  onRestart,
  onLeave,
}: BattleshipGameProps): JSX.Element => {
  const local = state.players[localPlayerId];
  const opponent = Object.values(state.players).find((player) => player.id !== localPlayerId) ?? null;
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">("horizontal");
  const [placements, setPlacements] = useState<BattleshipShip[]>(shipSizes.map(buildShip));
  const [now, setNow] = useState(Date.now());

  const readyPlacements = placements.every((ship) => ship.positions.length === ship.size);
  const myShips = local?.ships ?? [];
  const myShots = local?.shots ?? [];
  const opponentShots = opponent?.shots ?? [];
  const opponentShips = opponent?.ships ?? [];

  const myShipPoints = useMemo(
    () => myShips.flatMap((ship) => ship.positions),
    [myShips]
  );
  const placementPoints = useMemo(
    () => placements.flatMap((ship) => ship.positions),
    [placements]
  );
  const opponentShipPoints = useMemo(
    () => opponentShips.flatMap((ship) => ship.positions),
    [opponentShips]
  );

  const handlePlace = (point: BattleshipPoint) => {
    if (!local || state.phase !== BattleshipPhase.Placing || local.isReady) return;
    const nextIndex = placements.findIndex((ship) => ship.positions.length === 0);
    if (nextIndex === -1) return;
    const ship = placements[nextIndex];
    const positions: BattleshipPoint[] = [];
    for (let i = 0; i < ship.size; i += 1) {
      const pos = orientation === "horizontal" ? { x: point.x + i, y: point.y } : { x: point.x, y: point.y + i };
      if (!inside(pos) || overlaps(placements, pos)) return;
      positions.push(pos);
    }
    const updated = placements.map((s, idx) => idx === nextIndex ? { ...s, positions } : s);
    setPlacements(updated);
  };

  const handleFire = (point: BattleshipPoint) => {
    if (!local || state.phase !== BattleshipPhase.InProgress) return;
    if (state.turnPlayerId !== localPlayerId) return;
    onFire(point);
  };

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const timeLeft = Math.max(0, Math.floor((state.turnExpiresAt - now) / 1000));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Battleship</h1>
            <p className="text-sm text-slate-400">Room {state.roomId}</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <span>Turn: {state.players[state.turnPlayerId]?.name ?? "Waiting"}</span>
            <span>Timer: {timeLeft}s</span>
            <button className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200" type="button" onClick={onLeave}>Leave</button>
          </div>
        </div>

        {state.phase === BattleshipPhase.Placing && local && !local.isReady && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
            <div className="flex items-center justify-between">
              <span>Place your ships</span>
              <button className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200" type="button" onClick={() => setOrientation((prev) => prev === "horizontal" ? "vertical" : "horizontal")}>
                Rotate ({orientation})
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-400">Click on your board to place ships in order 5,4,3,3,2.</p>
            {readyPlacements && (
              <button className="mt-4 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900" type="button" onClick={() => onPlaceShips(placements)}>
                Ready
              </button>
            )}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          <BattleshipBoard
            title="Your Fleet"
            ships={local?.isReady ? myShipPoints : placementPoints}
            shots={opponentShots}
            highlightShots={[]}
            onCellClick={handlePlace}
            interactive={state.phase === BattleshipPhase.Placing && !local?.isReady}
          />
          <BattleshipBoard
            title="Enemy Waters"
            ships={opponentShipPoints}
            shots={myShots}
            onCellClick={handleFire}
            interactive={state.phase === BattleshipPhase.InProgress && state.turnPlayerId === localPlayerId}
          />
        </div>

        {state.phase === BattleshipPhase.GameOver && (
          <div className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            {state.players[state.winnerPlayerId]?.name ?? "Player"} wins the battle.
            {localPlayerId === state.hostPlayerId && (
              <button className="ml-3 rounded-lg bg-emerald-400 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-900" type="button" onClick={onRestart}>
                Restart
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
