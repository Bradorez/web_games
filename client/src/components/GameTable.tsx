import { useEffect, useRef, useState } from "react";
import { CardType, GameState } from "../../../shared/types";
import { Card } from "./Card";
import { GameLog } from "./GameLog";
import { PlayerMat } from "./PlayerMat";

interface GameTableProps {
  gameState: GameState;
  localPlayerId: string;
  actionControls?: React.ReactNode;
}

export const GameTable = ({ gameState, localPlayerId, actionControls }: GameTableProps): JSX.Element => {
  const localPlayer = gameState.players[localPlayerId];
  const otherPlayers = Object.values(gameState.players).filter((player) => player.id !== localPlayerId);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [uiScale, setUiScale] = useState(1);
  const sideInset = "-4%";
  const topRowY = "-4%";
  const sideRowY = "60%";
  const bottomRowY = "-4%";
  const logInset = "-4%";

  useEffect(() => {
    setUiScale(0.9);
  }, []);

  return (
    <div className="relative h-full w-full text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950" />

      <div className="absolute inset-0 origin-center" style={{ transform: `scale(${uiScale})` }}>
      {otherPlayers.length === 5 ? (
        <>
          <div className="absolute -translate-y-1/2" style={{ left: sideInset, top: sideRowY }}>
            <PlayerMat player={otherPlayers[0]} isCurrentTurn={gameState.turnPlayerId === otherPlayers[0].id} />
          </div>
          <div className="absolute left-1/2 flex -translate-x-1/2" style={{ top: topRowY, gap: "3%" }}>
            {otherPlayers.slice(1, 4).map((player) => (
              <PlayerMat key={player.id} player={player} isCurrentTurn={gameState.turnPlayerId === player.id} />
            ))}
          </div>
          <div className="absolute -translate-y-1/2" style={{ right: sideInset, top: sideRowY }}>
            <PlayerMat player={otherPlayers[4]} isCurrentTurn={gameState.turnPlayerId === otherPlayers[4].id} />
          </div>
        </>
      ) : otherPlayers.length === 4 ? (
        <>
          <div className="absolute -translate-y-1/2" style={{ left: sideInset, top: sideRowY }}>
            <PlayerMat player={otherPlayers[0]} isCurrentTurn={gameState.turnPlayerId === otherPlayers[0].id} />
          </div>
          <div className="absolute left-1/2 flex -translate-x-1/2" style={{ top: topRowY, gap: "3%" }}>
            {otherPlayers.slice(1, 3).map((player) => (
              <PlayerMat key={player.id} player={player} isCurrentTurn={gameState.turnPlayerId === player.id} />
            ))}
          </div>
          <div className="absolute -translate-y-1/2" style={{ right: sideInset, top: sideRowY }}>
            <PlayerMat player={otherPlayers[3]} isCurrentTurn={gameState.turnPlayerId === otherPlayers[3].id} />
          </div>
        </>
      ) : otherPlayers.length === 3 ? (
        <>
          <div className="absolute -translate-y-1/2" style={{ left: sideInset, top: sideRowY }}>
            <PlayerMat player={otherPlayers[0]} isCurrentTurn={gameState.turnPlayerId === otherPlayers[0].id} />
          </div>
          <div className="absolute left-1/2 -translate-x-1/2" style={{ top: topRowY }}>
            <PlayerMat player={otherPlayers[1]} isCurrentTurn={gameState.turnPlayerId === otherPlayers[1].id} />
          </div>
          <div className="absolute -translate-y-1/2" style={{ right: sideInset, top: sideRowY }}>
            <PlayerMat player={otherPlayers[2]} isCurrentTurn={gameState.turnPlayerId === otherPlayers[2].id} />
          </div>
        </>
      ) : (
        <div className="absolute left-0 right-0 flex justify-center" style={{ top: topRowY, gap: "4%" }}>
          {otherPlayers.map((player) => (
            <PlayerMat key={player.id} player={player} isCurrentTurn={gameState.turnPlayerId === player.id} />
          ))}
        </div>
      )}

      <div className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-10">
        <div className="flex flex-col items-center gap-2">
          <div className="relative h-56 w-40">
            {Array.from({ length: Math.max(1, Math.min(3, gameState.deck.length)) }).map((_, index) => (
              <div
                key={`deck-stack-${index}`}
                className="absolute"
                style={{ right: `${index * 6}px`, top: `${index * 6}px` }}
              >
                <Card id={`deck-${index}`} type={CardType.Unknown} isFaceUp={false} />
              </div>
            ))}
          </div>
          <div className="mt-2 text-sm uppercase tracking-wide text-slate-300">Deck {gameState.deck.length}</div>
        </div>
        <div className="rounded-full bg-amber-200 px-6 py-3 text-base font-semibold text-slate-900 shadow">Pot: {gameState.pot}</div>
      </div>

      <div className="absolute z-30 w-64 max-h-[30vh] pointer-events-auto" style={{ bottom: logInset, left: logInset }}>
        <GameLog entries={gameState.gameLog} />
      </div>

      <div className="absolute left-0 right-0 z-20 flex items-end justify-center gap-12" style={{ bottom: bottomRowY }}>
        {localPlayer && (
          <div ref={containerRef}>
            <PlayerMat player={localPlayer} isCurrentTurn={gameState.turnPlayerId === localPlayer.id} isLocalView />
          </div>
        )}
        {actionControls && (
          <div className="-translate-y-12 w-96">
            {actionControls}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};
