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

  return (
    <div
      className={`flex w-full max-w-md flex-col gap-3 rounded-xl border bg-slate-800/70 p-4 shadow ${borderClass}`}
    >
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold text-slate-100">{player.name}</div>
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-amber-200 px-3 py-1 text-sm font-semibold text-slate-900">
            Coins: {player.coins}
          </div>
          <div className="rounded-full bg-rose-500/80 px-3 py-1 text-sm font-semibold text-white">
            Lives: {player.lives}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {player.hand.map((card) => (
          <Card
            key={card.id}
            id={card.id}
            type={card.type}
            isFaceUp={card.type !== CardType.Unknown || card.isRevealed}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-2 opacity-70">
        {player.graveyard.map((card) => (
          <Card key={card.id} id={card.id} type={card.type} isFaceUp={true} />
        ))}
      </div>
    </div>
  );
};
