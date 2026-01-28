import { GamePhase, GameState, Player } from "../../shared/types";
import { advanceTurn, clearPending, updatePlayer } from "./challengeHelpers";
import { LossHandler, resolveAction } from "./challengeResolution";
import { appendLog } from "./log";

export const handleLoseCardChoiceFlow = (
  state: GameState,
  playerId: string,
  cardId: string,
  applyLoss: LossHandler
): GameState => {
  if (state.currentPhase !== GamePhase.LOSE_CARD_WINDOW) {
    return state;
  }
  if (state.pendingDiscardPlayerId !== playerId) {
    return state;
  }
  const player = state.players[playerId];
  if (!player) {
    return state;
  }
  const selectedIndex = player.hand.findIndex((card) => card.id === cardId);
  if (selectedIndex === -1) {
    return state;
  }
  const selectedCard = player.hand[selectedIndex];
  const remainingHand = player.hand.filter((_, index) => index !== selectedIndex);
  const revealedCard = { ...selectedCard, isRevealed: true };
  const updatedPlayer: Player = {
    ...player,
    hand: remainingHand,
    graveyard: [...player.graveyard, revealedCard],
    lives: remainingHand.length,
    isAlive: remainingHand.length > 0,
  };
  const updatedState = updatePlayer(
    appendLog(state, `${player.name} loses influence (${revealedCard.type}).`),
    playerId,
    updatedPlayer
  );

  const resolvedBase: GameState = {
    ...updatedState,
    currentPhase: GamePhase.ACTION_DECLARATION,
    pendingDiscardPlayerId: "",
  };

  if (!updatedState.pendingResolution) {
    return resolvedBase;
  }

  const resolution = updatedState.pendingResolution;
  const clearedResolution = { ...resolvedBase, pendingResolution: null };
  if (resolution.kind === "advance_turn") {
    return advanceTurn(clearPending(clearedResolution), resolution.sourcePlayerId);
  }
  if (resolution.kind === "resolve_action" && updatedState.pendingAction) {
    return resolveAction(clearPending(clearedResolution), updatedState.pendingAction, applyLoss);
  }
  return clearedResolution;
};
