import { BattleshipState } from "../../shared/types";
import { createBattleshipState, createPlayer } from "./state";

export const resetBattleshipState = (state: BattleshipState): BattleshipState => {
  const playerIds = Object.keys(state.players);
  const hostId = state.hostPlayerId || playerIds[0] || "";
  const base = createBattleshipState(state.roomId, hostId, state.players[hostId]?.name ?? hostId);
  const players = { ...base.players };

  playerIds.forEach((id) => {
    if (!players[id]) {
      players[id] = createPlayer(id, state.players[id]?.name ?? id);
    }
    players[id] = { ...players[id], isConnected: state.players[id]?.isConnected ?? true };
  });

  return {
    ...base,
    players,
    hostPlayerId: hostId,
    turnPlayerId: hostId,
  };
};
