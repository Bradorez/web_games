import { GameLogEntry, GameState } from "../../shared/types";

const createLogEntry = (message: string): GameLogEntry => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
  timestamp: Date.now(),
  message,
});

export const appendLog = (state: GameState, message: string): GameState => ({
  ...state,
  gameLog: [...state.gameLog, createLogEntry(message)],
});
