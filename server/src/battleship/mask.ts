import { BattleshipPlayer, BattleshipShip, BattleshipState } from "../../shared/types";

const maskShips = (ships: BattleshipShip[]): BattleshipShip[] =>
  ships.map((ship) => ({
    ...ship,
    positions: ship.isSunk ? ship.positions.map((pos) => ({ ...pos })) : [],
    hits: ship.hits.map((hit) => ({ ...hit })),
    isSunk: ship.isSunk,
  }));

export const maskBattleshipState = (
  state: BattleshipState,
  requestingPlayerId: string
): BattleshipState => {
  const players: Record<string, BattleshipPlayer> = {};
  for (const [playerId, player] of Object.entries(state.players)) {
    players[playerId] = playerId === requestingPlayerId
      ? { ...player, ships: player.ships.map((ship) => ({ ...ship })) }
      : { ...player, ships: maskShips(player.ships) };
  }

  return {
    ...state,
    players,
  };
};
