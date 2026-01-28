import { CardType, GameState } from "../../../shared/types";
import { Card } from "./Card";
import { PlayerMat } from "./PlayerMat";

interface GameTableProps {
  gameState: GameState;
  localPlayerId: string;
}

export const GameTable = ({
  gameState,
  localPlayerId,
}: GameTableProps): JSX.Element => {
  const localPlayer = gameState.players[localPlayerId];
  const otherPlayers = Object.values(gameState.players).filter(
    (player) => player.id !== localPlayerId
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 text-slate-100">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap justify-center gap-4">
          {otherPlayers.map((player) => (
            <PlayerMat
              key={player.id}
              player={player}
              isCurrentTurn={gameState.turnPlayerId === player.id}
            />
          ))}
        </div>

        <div className="flex items-center justify-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <Card id="deck" type={CardType.Unknown} isFaceUp={false} />
            <div className="text-xs uppercase tracking-wide text-slate-300">
              Deck {gameState.deck.length}
            </div>
          </div>
          <div className="rounded-full bg-amber-200 px-4 py-2 text-sm font-semibold text-slate-900 shadow">
            Pot: {gameState.pot}
          </div>
        </div>

        {localPlayer ? (
          <PlayerMat
            player={localPlayer}
            isCurrentTurn={gameState.turnPlayerId === localPlayer.id}
          />
        ) : (
          <div className="text-center text-slate-300">
            Waiting for player...
          </div>
        )}
      </div>
    </div>
  );
};
