import { useEffect, useRef, useState } from "react";
import { CardType, GameState } from "../../../shared/types";
import { Card } from "./Card";
import { GameLog } from "./GameLog";
import { PlayerMat } from "./PlayerMat";

interface GameTableProps {
  gameState: GameState;
  localPlayerId: string;
}

export const GameTable = ({ gameState, localPlayerId }: GameTableProps): JSX.Element => {
  const localPlayer = gameState.players[localPlayerId];
  const otherPlayers = Object.values(gameState.players).filter((player) => player.id !== localPlayerId);
  const count = Math.max((localPlayer ? 1 : 0) + otherPlayers.length, 1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [layout, setLayout] = useState({
    centerX: 0.45,
    centerY: 0.55,
    rx: 320,
    ry: 240,
    scale: 1,
  });

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      const leftSafe = 160;
      const rightSafe = 160;
      const topSafe = 110;
      const bottomSafe = 80;
      const usableWidth = Math.max(0, rect.width - leftSafe - rightSafe);
      const usableHeight = Math.max(0, rect.height - topSafe - bottomSafe);
      const centerX = 0.5;
      const centerY = (topSafe + usableHeight / 2) / rect.height;
      const maxRx = Math.max(280, usableWidth * 0.85);
      const maxRy = Math.max(180, usableHeight * 0.45);
      const matWidth = 460;
      const matHeight = 280;
      const angle = Math.PI / Math.max(2, count);
      const sinAngle = Math.sin(angle) || 1;
      const scaleLimitX = (2 * sinAngle * maxRx) / matWidth;
      const scaleLimitY = (2 * sinAngle * maxRy) / matHeight;
      const baseScale = count <= 3 ? 1 : count <= 5 ? 0.96 : 0.92;
      const scale = Math.max(0.85, Math.min(baseScale, scaleLimitX, scaleLimitY));
      setLayout({
        centerX,
        centerY,
        rx: maxRx,
        ry: maxRy,
        scale,
      });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 text-slate-100">
      <div className="relative">
        <div className="absolute right-0 top-0 w-full max-w-sm">
          <GameLog entries={gameState.gameLog} />
        </div>
        <div ref={containerRef} className="relative mx-auto h-[86vh] w-full max-w-7xl">
          {[...(localPlayer ? [localPlayer] : []), ...otherPlayers].map((player, index) => {
            const angle = (index * (2 * Math.PI)) / count + Math.PI / 2;
            const x = Math.cos(angle) * layout.rx;
            const y = Math.sin(angle) * layout.ry;
            return (
              <div
                key={player.id}
                style={{
                  left: `${layout.centerX * 100}%`,
                  top: `${layout.centerY * 100}%`,
                  transform: `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${layout.scale})`,
                }}
                className="absolute"
              >
                <PlayerMat player={player} isCurrentTurn={gameState.turnPlayerId === player.id} />
              </div>
            );
          })}
          <div style={{ left: `${layout.centerX * 100}%`, top: `${layout.centerY * 100}%` }} className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-10">
            <div className="flex flex-col items-center gap-2">
              <Card id="deck" type={CardType.Unknown} isFaceUp={false} />
              <div className="text-sm uppercase tracking-wide text-slate-300">Deck {gameState.deck.length}</div>
            </div>
            <div className="rounded-full bg-amber-200 px-6 py-3 text-base font-semibold text-slate-900 shadow">Pot: {gameState.pot}</div>
          </div>
        </div>
        {!localPlayer && <div className="text-center text-slate-300">Waiting for player...</div>}
      </div>
    </div>
  );
};
