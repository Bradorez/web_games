import { Player } from "../../../shared/types";

const STARTING_COINS = 2;

export const createPlayer = (id: string, name: string): Player => ({
  id,
  name,
  coins: STARTING_COINS,
  hand: [],
  isAlive: true,
  graveyard: [],
});

export const modifyCoins = (player: Player, amount: number): Player => ({
  ...player,
  coins: player.coins + amount,
});
