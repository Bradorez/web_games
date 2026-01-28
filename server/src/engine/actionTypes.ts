import { ActionType } from "../../shared/types";

export interface GameAction {
  type: ActionType;
  sourcePlayerId?: string;
  targetPlayerId?: string;
}
