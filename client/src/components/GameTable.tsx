import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CardType, GameState } from "../../../shared/types";
import { Card } from "./Card";
import { GameLog } from "./GameLog";
import { PlayerMat } from "./PlayerMat";

interface GameTableProps {
  gameState: GameState;
  localPlayerId: string;
  roomId: string;
  actionControls?: React.ReactNode;
}

export const GameTable = ({ gameState, localPlayerId, roomId, actionControls }: GameTableProps): JSX.Element => {
  const localPlayer = gameState.players[localPlayerId];
  const otherPlayers = Object.values(gameState.players).filter((player) => player.id !== localPlayerId);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const deckRef = useRef<HTMLDivElement | null>(null);
  const [deckRect, setDeckRect] = useState<DOMRect | null>(null);
  const [dealToken, setDealToken] = useState(0);
  const [uiScale, setUiScale] = useState(1);
  const [isDealing, setIsDealing] = useState(false);
  const lastDealIdRef = useRef<string | null>(null);
  const lastDealingTokenRef = useRef<number>(0);
  const sideInset = "-4%";
  const topRowY = "-4%";
  const sideRowY = "60%";
  const bottomRowY = "-4%";
  const logInset = "-4%";

  useEffect(() => {
    setUiScale(0.9);
  }, []);

  useLayoutEffect(() => {
    if (!deckRef.current) return;
    setDeckRect(deckRef.current.getBoundingClientRect());
  }, [gameState.deck.length]);

  useEffect(() => {
    const handleResize = () => {
      if (!deckRef.current) return;
      setDeckRect(deckRef.current.getBoundingClientRect());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!gameState.isStarted || !roomId) return;
    const dealEntry = [...gameState.gameLog]
      .reverse()
      .find((entry) => entry.message.includes("Cards have been dealt"));
    if (!dealEntry) return;
    if (lastDealIdRef.current === dealEntry.id) return;
    const storageKey = `coup:deal-played:${roomId}`;
    try {
      const lastPlayed = localStorage.getItem(storageKey);
      if (lastPlayed === dealEntry.id) {
        lastDealIdRef.current = dealEntry.id;
        return;
      }
      localStorage.setItem(storageKey, dealEntry.id);
    } catch {
      // ignore storage failures; fall back to in-memory tracking
    }
    lastDealIdRef.current = dealEntry.id;
    setDealToken((prev) => prev + 1);
  }, [gameState.isStarted, gameState.gameLog, roomId]);

  useEffect(() => {
    if (dealToken === 0) return;
    if (lastDealingTokenRef.current === dealToken) return;
    lastDealingTokenRef.current = dealToken;
    const playerCount = Object.keys(gameState.players).length;
    const totalCards = Math.max(1, playerCount) * 2;
    const lastDelay = 0.2 + (totalCards - 1) * 0.45;
    const totalDuration = (lastDelay + 1.2) * 1000;
    setIsDealing(true);
    const timeoutId = window.setTimeout(() => setIsDealing(false), totalDuration);
    return () => window.clearTimeout(timeoutId);
  }, [dealToken, gameState.players]);

  return (
    <div className="relative h-full w-full text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950" />

      <div className="absolute inset-0 origin-center" style={{ transform: `scale(${uiScale})` }}>
      {(() => {
        const order: string[] = [];
        if (otherPlayers.length === 5) {
          order.push(otherPlayers[0].id, otherPlayers[1].id, otherPlayers[2].id, otherPlayers[3].id, otherPlayers[4].id);
        } else if (otherPlayers.length === 4) {
          order.push(otherPlayers[0].id, otherPlayers[1].id, otherPlayers[2].id, otherPlayers[3].id);
        } else if (otherPlayers.length === 3) {
          order.push(otherPlayers[0].id, otherPlayers[1].id, otherPlayers[2].id);
        } else {
          otherPlayers.forEach((p) => order.push(p.id));
        }
        if (localPlayer) {
          order.push(localPlayer.id);
        }
        const baseIndex = (id: string) => Math.max(0, order.indexOf(id)) * 2;

        return otherPlayers.length === 5 ? (
        <>
          <div className="absolute -translate-y-1/2" style={{ left: sideInset, top: sideRowY }}>
            <PlayerMat player={otherPlayers[0]} isCurrentTurn={gameState.turnPlayerId === otherPlayers[0].id} deckRect={deckRect} dealToken={dealToken} uiScale={uiScale} dealBaseIndex={baseIndex(otherPlayers[0].id)} />
          </div>
          <div className="absolute left-1/2 flex -translate-x-1/2" style={{ top: topRowY, gap: "3%" }}>
            {otherPlayers.slice(1, 4).map((player) => (
              <PlayerMat key={player.id} player={player} isCurrentTurn={gameState.turnPlayerId === player.id} deckRect={deckRect} dealToken={dealToken} uiScale={uiScale} dealBaseIndex={baseIndex(player.id)} />
            ))}
          </div>
          <div className="absolute -translate-y-1/2" style={{ right: sideInset, top: sideRowY }}>
            <PlayerMat player={otherPlayers[4]} isCurrentTurn={gameState.turnPlayerId === otherPlayers[4].id} deckRect={deckRect} dealToken={dealToken} uiScale={uiScale} dealBaseIndex={baseIndex(otherPlayers[4].id)} />
          </div>
        </>
      ) : otherPlayers.length === 4 ? (
        <>
          <div className="absolute -translate-y-1/2" style={{ left: sideInset, top: sideRowY }}>
            <PlayerMat player={otherPlayers[0]} isCurrentTurn={gameState.turnPlayerId === otherPlayers[0].id} deckRect={deckRect} dealToken={dealToken} uiScale={uiScale} dealBaseIndex={baseIndex(otherPlayers[0].id)} />
          </div>
          <div className="absolute left-1/2 flex -translate-x-1/2" style={{ top: topRowY, gap: "3%" }}>
            {otherPlayers.slice(1, 3).map((player) => (
              <PlayerMat key={player.id} player={player} isCurrentTurn={gameState.turnPlayerId === player.id} deckRect={deckRect} dealToken={dealToken} uiScale={uiScale} dealBaseIndex={baseIndex(player.id)} />
            ))}
          </div>
          <div className="absolute -translate-y-1/2" style={{ right: sideInset, top: sideRowY }}>
            <PlayerMat player={otherPlayers[3]} isCurrentTurn={gameState.turnPlayerId === otherPlayers[3].id} deckRect={deckRect} dealToken={dealToken} uiScale={uiScale} dealBaseIndex={baseIndex(otherPlayers[3].id)} />
          </div>
        </>
      ) : otherPlayers.length === 3 ? (
        <>
          <div className="absolute -translate-y-1/2" style={{ left: sideInset, top: sideRowY }}>
            <PlayerMat player={otherPlayers[0]} isCurrentTurn={gameState.turnPlayerId === otherPlayers[0].id} deckRect={deckRect} dealToken={dealToken} uiScale={uiScale} dealBaseIndex={baseIndex(otherPlayers[0].id)} />
          </div>
          <div className="absolute left-1/2 -translate-x-1/2" style={{ top: topRowY }}>
            <PlayerMat player={otherPlayers[1]} isCurrentTurn={gameState.turnPlayerId === otherPlayers[1].id} deckRect={deckRect} dealToken={dealToken} uiScale={uiScale} dealBaseIndex={baseIndex(otherPlayers[1].id)} />
          </div>
          <div className="absolute -translate-y-1/2" style={{ right: sideInset, top: sideRowY }}>
            <PlayerMat player={otherPlayers[2]} isCurrentTurn={gameState.turnPlayerId === otherPlayers[2].id} deckRect={deckRect} dealToken={dealToken} uiScale={uiScale} dealBaseIndex={baseIndex(otherPlayers[2].id)} />
          </div>
        </>
      ) : (
        <div className="absolute left-0 right-0 flex justify-center" style={{ top: topRowY, gap: "4%" }}>
          {otherPlayers.map((player) => (
            <PlayerMat key={player.id} player={player} isCurrentTurn={gameState.turnPlayerId === player.id} deckRect={deckRect} dealToken={dealToken} uiScale={uiScale} dealBaseIndex={baseIndex(player.id)} />
          ))}
        </div>
      );
      })()}

      <div className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-10">
        <div className="flex flex-col items-center gap-2">
          <div ref={deckRef} className="relative h-56 w-40">
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
            <PlayerMat player={localPlayer} isCurrentTurn={gameState.turnPlayerId === localPlayer.id} isLocalView deckRect={deckRect} dealToken={dealToken} uiScale={uiScale} dealBaseIndex={Math.max(0, otherPlayers.length) * 2} />
          </div>
        )}
        {actionControls && (
          <div
            className={`-translate-y-12 w-96 ${isDealing ? "pointer-events-none opacity-60" : ""}`}
          >
            {actionControls}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};
