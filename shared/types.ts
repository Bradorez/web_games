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
  BLOCK_WINDOW = "BLOCK_WINDOW",
  BLOCK_CHALLENGE_WINDOW = "BLOCK_CHALLENGE_WINDOW",
  LOSE_CARD_WINDOW = "LOSE_CARD_WINDOW",
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
  /** Whether the player is controlled by AI. */
  isBot: boolean;
  /** Remaining lives for the player. */
  lives: number;
  /** Current coin count owned by the player. */
  coins: number;
  /** Cards currently in the player's hand. */
  hand: Card[];
  /** Whether the player is still active in the game. */
  isAlive: boolean;
  /** Whether the player's client is currently connected. */
  isConnected: boolean;
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
  /** The player id who created the room and can start the game. */
  hostPlayerId: string;
  /** Whether the game has been started by the host. */
  isStarted: boolean;
  /** Whether the game has concluded with a winner. */
  isGameOver: boolean;
  /** Player id of the winning player, if game has ended. */
  winnerPlayerId: string;
  /** Whether the game is paused while waiting for a reconnect. */
  isPaused: boolean;
  /** Player id currently blocking progress due to disconnect. */
  pausedPlayerId: string;
  /** Current action awaiting challenges, blocks, or resolution. */
  pendingAction: PendingAction | null;
  /** Player id expected to discard a card during the lose-card window. */
  pendingDiscardPlayerId: string;
  /** Chronological log of notable game events. */
  gameLog: GameLogEntry[];
}

export interface GameLogEntry {
  /** Unique identifier for the log entry. */
  id: string;
  /** Unix timestamp (ms) for when the entry occurred. */
  timestamp: number;
  /** Human-readable description of the event. */
  message: string;
}

export interface PendingAction {
  /** Player id of the actor declaring the action. */
  sourcePlayerId: string;
  /** Player id targeted by the action, if applicable. */
  targetPlayerId: string;
  /** The action being declared and subject to challenge. */
  actionType: ActionType;
  /** Timestamp (ms) when the current response window expires. */
  timerExpiresAt: number;
  /** Player id currently attempting a block, if any. */
  blockerId: string;
  /** Card being claimed for the action or block. */
  claimedCard: CardType;
  /** Players who have passed during the current response window. */
  passedPlayerIds: string[];
}
