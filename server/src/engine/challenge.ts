import { GamePhase, GameState, Player } from "../../../shared/types";
import { handleChallengeFlow, initiateActionFlow } from "./challengeFlow";
import { updatePlayer } from "./challengeHelpers";
import { GameAction } from "./actionTypes";
import { handlePassFlow } from "./challengePassFlow";

const requestDiscard = (state: GameState, playerId: string): GameState => ({
  ...state,
  currentPhase: GamePhase.LOSE_CARD_WINDOW,
  pendingDiscardPlayerId: playerId,
});

const applyLossIfForced = (state: GameState, playerId: string): GameState => {
  const player = state.players[playerId];
  if (!player) {
    return state;
  }

  if (player.hand.length > 1) {
    return requestDiscard(state, playerId);
  }

  if (player.hand.length === 1) {
    const [card] = player.hand;
    const updatedPlayer: Player = {
      ...player,
      hand: [],
      graveyard: [...player.graveyard, { ...card, isRevealed: true }],
      isAlive: false,
    };
    return updatePlayer(state, playerId, updatedPlayer);
  }

  return state;
};

export const initiateAction = (state: GameState, action: GameAction): GameState =>
  initiateActionFlow(state, action, applyLossIfForced);

export const handleChallenge = (
  state: GameState,
  challengerId: string
): GameState => handleChallengeFlow(state, challengerId, applyLossIfForced);

export const handlePass = (state: GameState, playerId: string): GameState =>
  handlePassFlow(state, playerId, applyLossIfForced);

export type { GameAction } from "./actionTypes";
