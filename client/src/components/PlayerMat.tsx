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
  const prevGraveyardIdsRef = useRef(new Set<string>());
  const [flipPulse, setFlipPulse] = useState<Record<string, number>>({});
  const orderRef = useRef<string[]>([]);
  const currentIds = [...player.hand, ...player.graveyard].map((card) => card.id);
  const currentSet = new Set(currentIds);
  const desiredSlots = Math.min(2, currentIds.length);
  const slotIds = orderRef.current.slice(0, 2);
  const available = currentIds.filter((id) => !slotIds.includes(id));
  for (let i = 0; i < 2; i += 1) {
    if (i >= desiredSlots) {
      slotIds[i] = undefined as unknown as string;
      continue;
    }
    if (!slotIds[i] || !currentSet.has(slotIds[i])) {
      slotIds[i] = available.shift() ?? slotIds[i];
    }
  }
  const nextIds = slotIds.filter((id): id is string => Boolean(id) && currentSet.has(id));
  while (nextIds.length < desiredSlots && available.length > 0) {
    nextIds.push(available.shift() as string);
  }
  orderRef.current = nextIds;
  const cardById = new Map<string, { card: (typeof player.hand)[number]; isGraveyard: boolean }>();
  player.hand.forEach((card) => cardById.set(card.id, { card, isGraveyard: false }));
  player.graveyard.forEach((card) => cardById.set(card.id, { card, isGraveyard: true }));
  const displayCards = orderRef.current
    .map((id) => cardById.get(id))
    .filter((value): value is { card: (typeof player.hand)[number]; isGraveyard: boolean } => Boolean(value));

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

  useEffect(() => {
    const prev = prevGraveyardIdsRef.current;
    const next = new Set(player.graveyard.map((card) => card.id));
    const newlyDead: string[] = [];
    next.forEach((id) => {
      if (!prev.has(id)) {
        newlyDead.push(id);
      }
    });
    if (newlyDead.length > 0) {
      const stamp = Date.now();
      setFlipPulse((current) => {
        const updated = { ...current };
        newlyDead.forEach((id) => {
          updated[id] = stamp;
        });
        return updated;
      });
    }
    prevGraveyardIdsRef.current = next;
  }, [player.graveyard]);


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
          const flipKey = flipPulse[card.id] ?? 0;
          const isFlipping = flipKey > 0;
          const initial = shouldAnimateDeal && !isGraveyard
            ? scaledOffset
              ? { x: scaledOffset.x, y: scaledOffset.y, opacity: 0, scale: 0.6 }
              : { y: -120, opacity: 0, scale: 0.6 }
            : false;
          const transition = isFlipping
            ? { duration: 0.5, ease: "easeOut" }
            : { duration: 1.2, delay: 0.2 + (dealBaseIndex + index) * 0.45, ease: [0.22, 1, 0.36, 1] };
          const rotateY = isGraveyard ? 180 : 0;
          return (
            <motion.div
              key={`${card.id}-${dealToken}-${flipKey}`}
              layout={false}
              initial={isFlipping ? { rotateY: 0 } : initial}
              animate={{
                x: 0,
                y: 0,
                opacity: 1,
                scale: 1,
                rotateY,
              }}
              transition={transition}
              style={{ transformStyle: "preserve-3d", perspective: 900 }}
            >
              <div style={{ backfaceVisibility: "hidden" }}>
                <Card
                  id={card.id}
                  type={card.type}
                  isFaceUp={card.type !== CardType.Unknown || card.isRevealed}
                  dimmed={false}
                  showDeadIcon={false}
                />
              </div>
              <div style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", position: "absolute", inset: 0 }}>
                <Card
                  id={`${card.id}-dead`}
                  type={card.type}
                  isFaceUp={true}
                  dimmed={Boolean(isLocalView && isGraveyard)}
                  showDeadIcon={Boolean(isGraveyard)}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
