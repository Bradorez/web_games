import { CardType, Player } from "../../../shared/types";
import { Card } from "./Card";

interface PlayerMatProps {
  player: Player;
  isCurrentTurn: boolean;
}

export const PlayerMat = ({
  player,
  isCurrentTurn,
}: PlayerMatProps): JSX.Element => {
  const borderClass = isCurrentTurn ? "border-emerald-400" : "border-slate-700";
  const displayCards = [
    ...player.hand.map((card) => ({ card, isGraveyard: false })),
    ...player.graveyard.map((card) => ({ card, isGraveyard: true })),
  ];

  return (
    <div
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
        {displayCards.map(({ card, isGraveyard }) => (
          <Card
            key={card.id}
            id={card.id}
            type={card.type}
            isFaceUp={isGraveyard || card.type !== CardType.Unknown || card.isRevealed}
          />
        ))}
      </div>
    </div>
  );
};
