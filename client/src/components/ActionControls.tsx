import { useEffect, useState } from "react";
import { ActionType, CardType, GamePhase, GameState } from "../../../shared/types";
import { ActionButtonGrid } from "./ActionButtonGrid";
import { BlockControls } from "./BlockControls";
import { ExchangePicker } from "./ExchangePicker";
import { LoseCardPicker } from "./LoseCardPicker";
import { TargetPicker } from "./TargetPicker";
export type ActionControlPayload = { event: "perform_action"; action: { type: ActionType; targetPlayerId?: string } } | { event: "challenge" } | { event: "pass" } | { event: "block"; claimedCard: CardType } | { event: "lose_card"; cardId: string } | { event: "start_game" } | { event: "restart_game" } | { event: "end_room" } | { event: "exchange_choice"; keepCardIds: string[] };

interface ActionControlsProps {
  gameState: GameState;
  myPlayerId: string;
  onAction: (payload: ActionControlPayload) => void;
}

export const ActionControls = ({ gameState, myPlayerId, onAction }: ActionControlsProps): JSX.Element | null => {
  if (!gameState) return null;
  const wrapperClass = "w-full max-w-2xl mx-auto";
  const [pendingTargetAction, setPendingTargetAction] = useState<ActionType | null>(null);
  const isMyTurn = gameState.turnPlayerId === myPlayerId;
  const currentPlayerName = gameState.players[gameState.turnPlayerId]?.name ?? "another player";
  const hostName = gameState.players[gameState.hostPlayerId]?.name ?? "the host";
  const pausedName = gameState.players[gameState.pausedPlayerId]?.name ?? "a player";
  const winnerName = gameState.players[gameState.winnerPlayerId]?.name ?? "Unknown";
  const pendingAction = gameState.pendingAction;
  const hasPassed = pendingAction?.passedPlayerIds.includes(myPlayerId) ?? false;
  const isAlive = gameState.players[myPlayerId]?.isAlive ?? false;
  const excludedId =
    gameState.currentPhase === GamePhase.BLOCK_CHALLENGE_WINDOW && pendingAction?.blockerId
      ? pendingAction.blockerId
      : pendingAction?.sourcePlayerId ?? "";
  const isEligibleResponder = Boolean(isAlive && pendingAction && myPlayerId !== excludedId);
  const isEligibleBlocker = Boolean(
    isAlive &&
      pendingAction &&
      ((pendingAction.actionType === ActionType.ForeignAid &&
        pendingAction.sourcePlayerId !== myPlayerId) ||
        ((pendingAction.actionType === ActionType.Steal ||
          pendingAction.actionType === ActionType.Assassinate) &&
          pendingAction.targetPlayerId === myPlayerId))
  );
  const pendingExchange = gameState.pendingExchange;
  const blockableActions = new Set([ActionType.ForeignAid, ActionType.Assassinate, ActionType.Steal]);
  const isBlockable = pendingAction ? blockableActions.has(pendingAction.actionType) : false;
  const targets = Object.values(gameState.players).filter((player) => player.id !== myPlayerId && player.isAlive);
  const hasTargets = targets.length > 0;
  useEffect(() => { if (gameState.currentPhase !== GamePhase.ACTION_DECLARATION || !isMyTurn) { setPendingTargetAction(null); } }, [gameState.currentPhase, isMyTurn]);
  if (gameState.isGameOver) return <div className={`${wrapperClass} flex flex-wrap items-center gap-3 rounded-xl border border-emerald-500/50 bg-emerald-500/10 p-4 text-sm text-emerald-100`}><span>{winnerName} wins the game.</span>{myPlayerId === gameState.hostPlayerId ? (<><button className="rounded-lg bg-emerald-400 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-900" onClick={() => onAction({ event: "restart_game" })} type="button">Restart</button><button className="rounded-lg bg-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-100" onClick={() => onAction({ event: "end_room" })} type="button">End Room</button></>) : (<span className="text-emerald-200">Waiting for {hostName} to restart or end the room.</span>)}</div>;
  if (gameState.isPaused) {
    return <div className={`${wrapperClass} rounded-xl border border-amber-400/60 bg-slate-950/90 p-4 text-sm text-amber-200`}>Waiting for {pausedName} to reconnect...</div>;
  }
  if (!gameState.isStarted) {
    if (myPlayerId === gameState.hostPlayerId) {
      return <div className={`${wrapperClass} flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300`}><span>Room ready. Start the game when everyone joins.</span><button className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900" onClick={() => onAction({ event: "start_game" })} type="button">Start Game</button></div>;
    }
    return <div className={`${wrapperClass} rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300`}>Waiting for {hostName} to start the game...</div>;
  }
  if (gameState.currentPhase === GamePhase.CHALLENGE_WINDOW) {
    if (isBlockable && pendingAction) {
      if (isEligibleBlocker && !hasPassed) {
        return (
          <div className={wrapperClass}>
            <BlockControls
              pendingAction={pendingAction}
              myPlayerId={myPlayerId}
              hasPassed={hasPassed}
              isAlive={isAlive}
              onBlock={(claimedCard) => onAction({ event: "block", claimedCard })}
              onPass={() => onAction({ event: "pass" })}
              onChallenge={() => onAction({ event: "challenge" })}
              showChallenge={true}
            />
          </div>
        );
      }
      if (!isEligibleResponder || hasPassed) {
        return <div className={`${wrapperClass} rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300`}>Waiting for other players...</div>;
      }
      return <div className={`${wrapperClass} flex flex-wrap gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4`}><button className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white" onClick={() => onAction({ event: "challenge" })} type="button">Challenge</button><button className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-100" onClick={() => onAction({ event: "pass" })} type="button">Pass</button></div>;
    }
    if (!isEligibleResponder || hasPassed) {
      return <div className={`${wrapperClass} rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300`}>Waiting for other players...</div>;
    }
    return <div className={`${wrapperClass} flex flex-wrap gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4`}><button className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white" onClick={() => onAction({ event: "challenge" })} type="button">Challenge</button><button className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-100" onClick={() => onAction({ event: "pass" })} type="button">Pass</button></div>;
  }
  if (gameState.currentPhase === GamePhase.BLOCK_CHALLENGE_WINDOW) {
    if (!isEligibleResponder || hasPassed) {
      return <div className={`${wrapperClass} rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300`}>Waiting for other players...</div>;
    }
    return <div className={`${wrapperClass} flex flex-wrap gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4`}><button className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white" onClick={() => onAction({ event: "challenge" })} type="button">Challenge</button><button className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-100" onClick={() => onAction({ event: "pass" })} type="button">Pass</button></div>;
  }
  if (gameState.currentPhase === GamePhase.LOSE_CARD_WINDOW) {
    if (gameState.pendingDiscardPlayerId === myPlayerId) {
      const hand = gameState.players[myPlayerId]?.hand ?? [];
      return <div className={wrapperClass}><LoseCardPicker hand={hand} onSelect={(cardId) => onAction({ event: "lose_card", cardId })} /></div>;
    }
    return <div className={`${wrapperClass} rounded-xl border border-amber-400/60 bg-amber-200/10 p-4 text-sm text-amber-200`}>Waiting for player to discard...</div>;
  }
  if (gameState.currentPhase === GamePhase.EXCHANGE_WINDOW) {
    if (pendingExchange?.playerId === myPlayerId) {
      return <div className={wrapperClass}><ExchangePicker options={pendingExchange.options} keepCount={pendingExchange.keepCount} onConfirm={(keepCardIds) => onAction({ event: "exchange_choice", keepCardIds })} /></div>;
    }
    return <div className={`${wrapperClass} rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300`}>Waiting for {currentPlayerName} to exchange...</div>;
  }
  if (gameState.currentPhase === GamePhase.BLOCK_WINDOW && pendingAction) {
    if (isMyTurn) {
      return <div className={`${wrapperClass} flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300`}><span>Waiting for blocks...</span></div>;
    }
    if (!isEligibleBlocker || hasPassed) {
      return <div className={`${wrapperClass} rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300`}>Waiting for other players...</div>;
    }
    return <div className={wrapperClass}><BlockControls pendingAction={pendingAction} myPlayerId={myPlayerId} hasPassed={hasPassed} isAlive={isAlive} onBlock={(claimedCard) => onAction({ event: "block", claimedCard })} onPass={() => onAction({ event: "pass" })} showPass={isEligibleBlocker} /></div>;
  }
  if (gameState.currentPhase !== GamePhase.ACTION_DECLARATION) {
    return <div className={`${wrapperClass} rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300`}>Waiting for {currentPlayerName}...</div>;
  }
  if (!isMyTurn) {
    return <div className={`${wrapperClass} rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300`}>Waiting for {currentPlayerName} to act...</div>;
  }
  if (pendingTargetAction) {
    return <div className={wrapperClass}><TargetPicker actionType={pendingTargetAction} targets={targets} onSelect={(playerId) => { onAction({ event: "perform_action", action: { type: pendingTargetAction, targetPlayerId: playerId } }); setPendingTargetAction(null); }} onCancel={() => setPendingTargetAction(null)} /></div>;
  }
  return (
    <div className={`${wrapperClass} flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4`}>
      <div className="text-sm text-slate-300">Choose your action:</div>
      <ActionButtonGrid hasTargets={hasTargets} onSelect={(actionType, needsTarget) => { if (needsTarget) { setPendingTargetAction(actionType); } else { onAction({ event: "perform_action", action: { type: actionType } }); } }} />
      {!hasTargets && <div className="text-xs text-slate-400">Targeted actions are disabled until opponents join.</div>}
    </div>
  );
};
