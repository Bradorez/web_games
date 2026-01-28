import { Player } from "../../../shared/types";

const STARTING_COINS = 2;
const STARTING_LIVES = 2;

export const createPlayer = (
  id: string,
  name: string,
  isBot = false
): Player => ({
  id,
  name,
  isBot,
  lives: STARTING_LIVES,
  coins: STARTING_COINS,
  hand: [],
  isAlive: true,
  isConnected: true,
  graveyard: [],
});

export const modifyCoins = (player: Player, amount: number): Player => ({
  ...player,
  coins: player.coins + amount,
});
