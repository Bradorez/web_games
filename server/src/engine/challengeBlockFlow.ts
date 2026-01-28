import { ActionType, CardType, GamePhase, GameState } from "../../../shared/types";
import { CHALLENGE_DURATION_MS } from "./challengeResolution";
import { appendLog } from "./log";

const BLOCK_CLAIMS: Record<ActionType, CardType[]> = {
  [ActionType.ForeignAid]: [CardType.Duke],
  [ActionType.Steal]: [CardType.Captain, CardType.Ambassador],
  [ActionType.Assassinate]: [CardType.Contessa],
  [ActionType.Income]: [],
  [ActionType.Coup]: [],
  [ActionType.Tax]: [],
  [ActionType.Exchange]: [],
};

const canBlockAction = (
  state: GameState,
  blockerId: string
): { ok: boolean; allowed: CardType[] } => {
  const pending = state.pendingAction;
  if (!pending) {
    return { ok: false, allowed: [] };
  }
  const allowed = BLOCK_CLAIMS[pending.actionType] ?? [];
  if (allowed.length === 0) {
    return { ok: false, allowed: [] };
  }
  if (!state.players[blockerId]?.isAlive) {
    return { ok: false, allowed };
  }
  return { ok: pending.sourcePlayerId !== blockerId, allowed };
};

export const handleBlockFlow = (
  state: GameState,
  blockerId: string,
  claimedCard: CardType
): GameState => {
  if (
    (state.currentPhase !== GamePhase.BLOCK_WINDOW &&
      state.currentPhase !== GamePhase.CHALLENGE_WINDOW) ||
    !state.pendingAction
  ) {
    return state;
  }
  if (state.pendingAction.blockerId) {
    return state;
  }
  const { ok, allowed } = canBlockAction(state, blockerId);
  if (!ok || !allowed.includes(claimedCard)) {
    return state;
  }

  return {
    ...appendLog(
      state,
      `${state.players[blockerId]?.name ?? "Player"} blocks with ${claimedCard}.`
    ),
    currentPhase: GamePhase.BLOCK_CHALLENGE_WINDOW,
    pendingAction: {
      ...state.pendingAction,
      blockerId,
      claimedCard,
      passedPlayerIds: [],
      timerExpiresAt: Date.now() + CHALLENGE_DURATION_MS,
    },
  };
};
