import { CardType, GamePhase, GameState, Player } from "../../../shared/types";
import { handleChallengeFlow } from "./challengeFlow";
import { initiateActionFlow } from "./challengeInitiateFlow";
import { updatePlayer } from "./challengeHelpers";
import { GameAction } from "./actionTypes";
import { handlePassFlow } from "./challengePassFlow";
import { enforceGameOver } from "./gameOutcome";
import { appendLog } from "./log";
import { applyExchangeChoice } from "./challengeResolution";
import { handleBlockFlow } from "./challengeBlockFlow";

const applyLossIfForced = (state: GameState, playerId: string): GameState => {
  const player = state.players[playerId];
  if (!player) {
    return state;
  }
  const lostCard = player.hand[0];
  if (!lostCard) {
    return state;
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
  return updatePlayer(
    appendLog(state, `${player.name} loses influence (${revealedCard.type}).`),
    playerId,
    updatedPlayer
  );
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

export type { GameAction } from "./actionTypes";
