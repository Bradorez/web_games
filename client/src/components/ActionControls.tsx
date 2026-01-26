import { ActionType, GamePhase, GameState } from "../../../shared/types";
export type ActionControlPayload =
  | { event: "perform_action"; action: { type: ActionType } }
  | { event: "challenge" }
  | { event: "pass" }
  | { event: "start_game" };

interface ActionControlsProps {
  gameState: GameState;
  myPlayerId: string;
  onAction: (payload: ActionControlPayload) => void;
}

const actionButtons = [
  { label: "Income", type: ActionType.Income, className: "bg-emerald-400 text-slate-900" },
  { label: "Foreign Aid", type: ActionType.ForeignAid, className: "bg-lime-300 text-slate-900" },
  { label: "Tax", type: ActionType.Tax, className: "bg-amber-300 text-slate-900" },
  { label: "Steal", type: ActionType.Steal, className: "bg-sky-300 text-slate-900" },
  { label: "Assassinate", type: ActionType.Assassinate, className: "bg-rose-500 text-white" },
  { label: "Exchange", type: ActionType.Exchange, className: "bg-violet-300 text-slate-900" },
  { label: "Coup", type: ActionType.Coup, className: "bg-red-600 text-white" },
];

export const ActionControls = ({ gameState, myPlayerId, onAction }: ActionControlsProps): JSX.Element | null => {
  if (!gameState) return null;
  const isMyTurn = gameState.turnPlayerId === myPlayerId;
  const currentPlayerName = gameState.players[gameState.turnPlayerId]?.name ?? "another player";
  const hostName = gameState.players[gameState.hostPlayerId]?.name ?? "the host";
  const pausedName = gameState.players[gameState.pausedPlayerId]?.name ?? "a player";
  const hasTargets = Object.values(gameState.players).some((player) => player.id !== myPlayerId && player.isAlive);

  if (gameState.isPaused) {
    return <div className="rounded-xl border border-amber-400/60 bg-amber-200/10 p-4 text-sm text-amber-200">Waiting for {pausedName} to reconnect...</div>;
  }

  if (!gameState.isStarted) {
    if (myPlayerId === gameState.hostPlayerId) {
      return (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
          <span>Room ready. Start the game when everyone joins.</span>
          <button className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900" onClick={() => onAction({ event: "start_game" })} type="button">Start Game</button>
        </div>
      );
    }
    return <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">Waiting for {hostName} to start the game...</div>;
  }

  if (gameState.currentPhase === GamePhase.CHALLENGE_WINDOW) {
    if (isMyTurn) {
      return <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">Waiting for challenges...</div>;
    }
    return (
      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <button className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white" onClick={() => onAction({ event: "challenge" })} type="button">Challenge</button>
        <button className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-100" onClick={() => onAction({ event: "pass" })} type="button">Pass</button>
      </div>
    );
  }

  if (gameState.currentPhase === GamePhase.LOSE_CARD_WINDOW) {
    return <div className="rounded-xl border border-amber-400/60 bg-amber-200/10 p-4 text-sm text-amber-200">Select a card from your hand to lose.</div>;
  }

  if (gameState.currentPhase === GamePhase.BLOCK_WINDOW) {
    if (isMyTurn) {
      return (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
          <span>Waiting for blocks...</span>
          {!hasTargets && <button className="rounded-lg bg-slate-700 px-3 py-1 text-xs font-semibold text-slate-100" onClick={() => onAction({ event: "pass" })} type="button">Continue</button>}
        </div>
      );
    }
    return <div className="flex flex-wrap gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4"><button className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-100" onClick={() => onAction({ event: "pass" })} type="button">Pass</button></div>;
  }

  if (gameState.currentPhase !== GamePhase.ACTION_DECLARATION) {
    return <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">Waiting for {currentPlayerName}...</div>;
  }

  if (!isMyTurn) {
    return <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">Waiting for {currentPlayerName} to act...</div>;
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="text-sm text-slate-300">Choose your action:</div>
      <div className="flex flex-wrap gap-2">
        {actionButtons.map((action) => {
          const needsTarget = action.type === ActionType.Steal || action.type === ActionType.Assassinate || action.type === ActionType.Coup;
          const isDisabled = needsTarget && !hasTargets;
          return (
            <button key={action.type} className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide ${action.className} ${isDisabled ? "cursor-not-allowed opacity-40" : ""}`} onClick={() => !isDisabled && onAction({ event: "perform_action", action: { type: action.type } })} type="button">{action.label}</button>
          );
        })}
      </div>
      {!hasTargets && <div className="text-xs text-slate-400">Targeted actions are disabled until opponents join.</div>}
    </div>
  );
};
