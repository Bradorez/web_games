import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CardType, Player } from "../../../shared/types";
import { Card } from "./Card";

interface PlayerMatProps {
  player: Player;
  isCurrentTurn: boolean;
  isLocalView?: boolean;
  hasPassed?: boolean;
  deckRect?: DOMRect | null;
  dealToken?: number;
  uiScale?: number;
  dealBaseIndex?: number;
  revealEvent?: {
    playerId: string;
    cardType: CardType;
    timestamp: number;
  } | null;
  exchangeEvent?: { timestamp: number; message: string } | null;
}

export const PlayerMat = ({
  player,
  isCurrentTurn,
  isLocalView = false,
  hasPassed = false,
  deckRect,
  dealToken = 0,
  uiScale = 1,
  dealBaseIndex = 0,
  revealEvent = null,
  exchangeEvent = null,
}: PlayerMatProps): JSX.Element => {
  const borderClass = isCurrentTurn ? "border-emerald-400" : "border-slate-700";
  const matRef = useRef<HTMLDivElement | null>(null);
  const [dealOffset, setDealOffset] = useState<{ x: number; y: number } | null>(null);
  const lastDealTokenRef = useRef(0);
  const prevGraveyardIdsRef = useRef(new Set<string>());
  const [flipPulse, setFlipPulse] = useState<Record<string, number>>({});
  const lastRevealRef = useRef<number>(0);
  const lastExchangeRef = useRef<number>(0);
  const prevHandIdsRef = useRef<string[]>([]);
  const prevOrderRef = useRef<string[]>([]);
  const slotRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [revealAnim, setRevealAnim] = useState<{
    key: number;
    cardType: CardType;
    slotIndex: number;
    offset: { x: number; y: number };
  } | null>(null);
  const [exchangeAnim, setExchangeAnim] = useState<{
    key: number;
    slotIndex: number;
    offset: { x: number; y: number };
  } | null>(null);
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

  useEffect(() => {
    prevHandIdsRef.current = player.hand.map((card) => card.id);
    prevOrderRef.current = orderRef.current.slice(0, 2);
  }, [player.hand, player.graveyard]);

  useEffect(() => {
    if (!revealEvent || revealEvent.playerId !== player.id) {
      return;
    }
    if (lastRevealRef.current === revealEvent.timestamp) {
      return;
    }
    lastRevealRef.current = revealEvent.timestamp;
    const prevIds = prevHandIdsRef.current;
    const currentIds = player.hand.map((card) => card.id);
    const removedId = prevIds.find((id) => !currentIds.includes(id));
    const slotIndex = Math.max(0, prevOrderRef.current.indexOf(removedId ?? ""));
    const slotEl = slotRefs.current[slotIndex];
    const fallbackOffset = dealOffset ? { x: dealOffset.x / uiScale, y: dealOffset.y / uiScale } : { x: 0, y: 0 };
    let offset = fallbackOffset;
    if (deckRect && slotEl) {
      const deckCenterX = deckRect.left + deckRect.width / 2;
      const deckCenterY = deckRect.top + deckRect.height / 2;
      const slotRect = slotEl.getBoundingClientRect();
      const slotCenterX = slotRect.left + slotRect.width / 2;
      const slotCenterY = slotRect.top + slotRect.height / 2;
      offset = {
        x: (deckCenterX - slotCenterX) / uiScale,
        y: (deckCenterY - slotCenterY) / uiScale,
      };
    }
    setRevealAnim({
      key: revealEvent.timestamp,
      cardType: revealEvent.cardType,
      slotIndex,
      offset,
    });
    const timeoutId = window.setTimeout(() => setRevealAnim(null), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [revealEvent, player.id, player.hand, deckRect, dealOffset, uiScale]);

  useEffect(() => {
    if (!exchangeEvent || isLocalView) return;
    if (lastExchangeRef.current === exchangeEvent.timestamp) return;
    if (!exchangeEvent.message.includes(player.name)) return;
    lastExchangeRef.current = exchangeEvent.timestamp;
    const slotIndex = 0;
    const slotEl = slotRefs.current[slotIndex];
    const fallbackOffset = dealOffset ? { x: dealOffset.x / uiScale, y: dealOffset.y / uiScale } : { x: 0, y: 0 };
    let offset = fallbackOffset;
    if (deckRect && slotEl) {
      const deckCenterX = deckRect.left + deckRect.width / 2;
      const deckCenterY = deckRect.top + deckRect.height / 2;
      const slotRect = slotEl.getBoundingClientRect();
      const slotCenterX = slotRect.left + slotRect.width / 2;
      const slotCenterY = slotRect.top + slotRect.height / 2;
      offset = {
        x: (deckCenterX - slotCenterX) / uiScale,
        y: (deckCenterY - slotCenterY) / uiScale,
      };
    }
    setExchangeAnim({ key: exchangeEvent.timestamp, slotIndex, offset });
    const timeoutId = window.setTimeout(() => setExchangeAnim(null), 1200);
    return () => window.clearTimeout(timeoutId);
  }, [exchangeEvent, player.name, deckRect, dealOffset, uiScale, isLocalView]);

  return (
    <div
      ref={matRef}
      className={`relative flex w-full max-w-2xl flex-col gap-5 rounded-2xl border bg-slate-800/70 p-6 shadow ${borderClass}`}
    >
      <div
        className={`absolute bottom-3 right-3 h-3 w-3 rounded-full ${hasPassed ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" : "bg-slate-600/60"}`}
        title={hasPassed ? "Passed" : "Not passed"}
      />
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
          const showReveal = revealAnim && revealAnim.slotIndex === index;
          const showExchange = exchangeAnim && exchangeAnim.slotIndex === index;
          return (
            <div
              key={`${card.id}-slot`}
              ref={(el) => {
                slotRefs.current[index] = el;
              }}
              className="relative"
            >
              {showExchange && (
                <motion.div
                  key={`exchange-out-${exchangeAnim.key}`}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{ x: exchangeAnim.offset.x, y: exchangeAnim.offset.y, opacity: 0.9, scale: 0.9 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="absolute inset-0 z-20 pointer-events-none"
                >
                  <Card id={`exchange-out-${exchangeAnim.key}`} type={CardType.Unknown} isFaceUp={false} />
                </motion.div>
              )}
              {showExchange && (
                <motion.div
                  key={`exchange-in-${exchangeAnim.key}`}
                  initial={{ x: exchangeAnim.offset.x, y: exchangeAnim.offset.y, opacity: 1, scale: 0.9 }}
                  animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 z-10 pointer-events-none"
                >
                  <Card id={`exchange-in-${exchangeAnim.key}`} type={CardType.Unknown} isFaceUp={false} />
                </motion.div>
              )}
              {showReveal && (
                <motion.div
                  key={`reveal-${revealAnim.key}`}
                  initial={{ rotateY: 0, x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    rotateY: [0, 180, 180],
                    x: [0, 0, revealAnim.offset.x],
                    y: [0, 0, revealAnim.offset.y],
                    opacity: [1, 1, 0],
                    scale: [1, 1, 0.95],
                  }}
                  transition={{
                    rotateY: { duration: 1.0, ease: "easeOut" },
                    x: { duration: 1.2, times: [0, 0.55, 1], ease: "easeInOut" },
                    y: { duration: 1.2, times: [0, 0.55, 1], ease: "easeInOut" },
                    opacity: { duration: 1.6, times: [0, 0.75, 1], ease: "easeInOut" },
                    scale: { duration: 1.2, times: [0, 0.55, 1], ease: "easeInOut" },
                  }}
                  style={{ transformStyle: "preserve-3d", perspective: 900 }}
                  className="absolute inset-0 z-20 pointer-events-none"
                >
                  <div style={{ backfaceVisibility: "hidden" }}>
                    <Card id={`reveal-face-${revealAnim.key}`} type={revealAnim.cardType} isFaceUp={true} />
                  </div>
                  <div style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", position: "absolute", inset: 0 }}>
                    <Card id={`reveal-face-back-${revealAnim.key}`} type={revealAnim.cardType} isFaceUp={true} />
                  </div>
                </motion.div>
              )}

              {showReveal && (
                <motion.div
                  key={`deal-${revealAnim.key}`}
                  initial={{ x: revealAnim.offset.x, y: revealAnim.offset.y, opacity: 1, scale: 0.9 }}
                  animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  transition={{ delay: 1.85, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 z-10 pointer-events-none"
                >
                  <Card id={`reveal-deal-${revealAnim.key}`} type={CardType.Unknown} isFaceUp={false} />
                </motion.div>
              )}

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
                style={{
                  transformStyle: "preserve-3d",
                  perspective: 900,
                  visibility: showReveal ? "hidden" : "visible",
                }}
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
            </div>
          );
        })}
      </div>
    </div>
  );
};
