import { CardType, GamePhase, GameState, Player } from "../../shared/types";
import { handleChallengeFlow } from "./challengeFlow";
import { initiateActionFlow } from "./challengeInitiateFlow";
import { returnCoinsOnDeath, updatePlayer } from "./challengeHelpers";
import { GameAction } from "./actionTypes";
import { handlePassFlow } from "./challengePassFlow";
import { enforceGameOver } from "./gameOutcome";
import { appendLog } from "./log";
import { applyExchangeChoice } from "./challengeResolution";
import { handleBlockFlow } from "./challengeBlockFlow";
import { handleLoseCardChoiceFlow } from "./challengeLoseCardFlow";

const applyLossIfForced = (state: GameState, playerId: string): GameState => {
  const player = state.players[playerId];
  if (!player) {
    return state;
  }
  const lostCard = player.hand[0];
  if (!lostCard) {
    return state;
  }
  if (player.hand.length > 1) {
    return {
      ...appendLog(state, `${player.name} must choose a card to lose.`),
      currentPhase: GamePhase.LOSE_CARD_WINDOW,
      pendingDiscardPlayerId: playerId,
    };
  }
  const remainingHand = player.hand.slice(1);
  const revealedCard = { ...lostCard, isRevealed: true };
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
  return returnCoinsOnDeath(updatedState, playerId);
};

export const initiateAction = (state: GameState, action: GameAction): GameState =>
  enforceGameOver(initiateActionFlow(state, action, applyLossIfForced));

export const handleChallenge = (
  state: GameState,
  challengerId: string
): GameState =>
  enforceGameOver(handleChallengeFlow(state, challengerId, applyLossIfForced));

export const handlePass = (state: GameState, playerId: string): GameState =>
  enforceGameOver(handlePassFlow(state, playerId, applyLossIfForced));

export const handleBlock = (
  state: GameState,
  blockerId: string,
  claimedCard: CardType
): GameState => enforceGameOver(handleBlockFlow(state, blockerId, claimedCard));

export const handleExchangeChoice = (
  state: GameState,
  playerId: string,
  keepCardIds: string[]
): GameState => enforceGameOver(applyExchangeChoice(state, playerId, keepCardIds));

export const handleLoseCardChoice = (
  state: GameState,
  playerId: string,
  cardId: string
): GameState =>
  enforceGameOver(handleLoseCardChoiceFlow(state, playerId, cardId, applyLossIfForced));

export type { GameAction } from "./actionTypes";
