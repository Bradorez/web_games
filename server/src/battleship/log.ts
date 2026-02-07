import { BattleshipState, GameLogEntry } from "../../shared/types";

const createLogEntry = (message: string): GameLogEntry => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
  timestamp: Date.now(),
  message,
});

export const appendLog = (
  state: BattleshipState,
  message: string
): BattleshipState => ({
  ...state,
  gameLog: [...state.gameLog, createLogEntry(message)],
});
