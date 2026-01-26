export enum CardType {
  Duke = "Duke",
  Assassin = "Assassin",
  Captain = "Captain",
  Ambassador = "Ambassador",
  Contessa = "Contessa",
  Unknown = "Unknown",
}

export enum GamePhase {
  WAITING_FOR_PLAYERS = "WAITING_FOR_PLAYERS",
  ACTION_DECLARATION = "ACTION_DECLARATION",
  CHALLENGE_WINDOW = "CHALLENGE_WINDOW",
  BLOCK_RESPONSE = "BLOCK_RESPONSE",
  RESOLVING = "RESOLVING",
}

export enum ActionType {
  Income = "Income",
  ForeignAid = "ForeignAid",
  Coup = "Coup",
  Tax = "Tax",
  Assassinate = "Assassinate",
  Exchange = "Exchange",
  Steal = "Steal",
}

export interface Card {
  /** Unique identifier for a specific card instance. */
  id: string;
  /** The influence type this card represents. */
  type: CardType;
  /** Whether this card has been revealed face-up. */
  isRevealed: boolean;
}

export interface Player {
  /** Unique identifier for the player. */
  id: string;
  /** Display name chosen by the player. */
  name: string;
  /** Current coin count owned by the player. */
  coins: number;
  /** Cards currently in the player's hand. */
  hand: Card[];
  /** Whether the player is still active in the game. */
  isAlive: boolean;
  /** Cards the player has lost or discarded. */
  graveyard: Card[];
}

export interface GameState {
  /** Remaining draw deck of influence cards. */
  deck: Card[];
  /** All players keyed by their unique player id. */
  players: Record<string, Player>;
  /** The player id whose turn is currently active. */
  turnPlayerId: string;
  /** Current phase of the game flow. */
  currentPhase: GamePhase;
  /** Central pool of coins, if the rules use one. */
  pot: number;
}

export interface PendingAction {
  /** Player id of the actor declaring the action. */
  sourcePlayerId: string;
  /** Player id targeted by the action, if applicable. */
  targetPlayerId: string;
  /** The action being declared and subject to challenge. */
  actionType: ActionType;
  /** Whether the challenge timer is currently running. */
  timerStatus: boolean;
}
