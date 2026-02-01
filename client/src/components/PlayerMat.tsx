import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CardType, Player } from "../../../shared/types";
import { Card } from "./Card";

interface PlayerMatProps {
  player: Player;
  isCurrentTurn: boolean;
  isLocalView?: boolean;
  deckRect?: DOMRect | null;
  dealToken?: number;
  uiScale?: number;
  dealBaseIndex?: number;
}

export const PlayerMat = ({
  player,
  isCurrentTurn,
  isLocalView = false,
  deckRect,
  dealToken = 0,
  uiScale = 1,
  dealBaseIndex = 0,
}: PlayerMatProps): JSX.Element => {
  const borderClass = isCurrentTurn ? "border-emerald-400" : "border-slate-700";
  const matRef = useRef<HTMLDivElement | null>(null);
  const [dealOffset, setDealOffset] = useState<{ x: number; y: number } | null>(null);
  const lastDealTokenRef = useRef(0);
  const displayCards = [
    ...player.hand.map((card) => ({ card, isGraveyard: false })),
    ...player.graveyard.map((card) => ({ card, isGraveyard: true })),
  ];

  useLayoutEffect(() => {
    if (!deckRect || !matRef.current) {
      return;
    }
    const rect = matRef.current.getBoundingClientRect();
    const deckCenterX = deckRect.left + deckRect.width / 2;
    const deckCenterY = deckRect.top + deckRect.height / 2;
    const matCenterX = rect.left + rect.width / 2;
    const matCenterY = rect.top + rect.height / 2;
    setDealOffset({ x: deckCenterX - matCenterX, y: deckCenterY - matCenterY });
  }, [deckRect]);


  return (
    <div
      ref={matRef}
      className={`flex w-full max-w-2xl flex-col gap-5 rounded-2xl border bg-slate-800/70 p-6 shadow ${borderClass}`}
    >
      <div className="flex items-center justify-between">
        <div className="text-2xl font-semibold text-slate-100">{player.name}</div>
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-amber-200 px-4 py-2 text-base font-semibold text-slate-900">
            Coins: {player.coins}
          </div>
          <div className="rounded-full bg-rose-500/80 px-4 py-2 text-base font-semibold text-white">
            Lives: {player.lives}
          </div>
        </div>
      </div>

      <div className="flex flex-row gap-4">
        {displayCards.map(({ card, isGraveyard }, index) => {
          const shouldAnimateDeal = dealToken > 0;
          if (shouldAnimateDeal && lastDealTokenRef.current !== dealToken) {
            lastDealTokenRef.current = dealToken;
          }
          const scaledOffset = dealOffset
            ? { x: dealOffset.x / uiScale, y: dealOffset.y / uiScale }
            : null;
          const initial = shouldAnimateDeal
            ? scaledOffset
              ? { x: scaledOffset.x, y: scaledOffset.y, opacity: 0, scale: 0.6 }
              : { y: -120, opacity: 0, scale: 0.6 }
            : false;
          return (
            <motion.div
              key={`${card.id}-${dealToken}`}
              layout={false}
              initial={initial}
              animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.2 + (dealBaseIndex + index) * 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card
                id={card.id}
                type={card.type}
                isFaceUp={isGraveyard || card.type !== CardType.Unknown || card.isRevealed}
                dimmed={Boolean(isLocalView && isGraveyard)}
                showDeadIcon={Boolean(isGraveyard)}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
