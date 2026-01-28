import { Player } from "../../shared/types";

export const getNextTurnPlayerId = (
  players: Record<string, Player>,
  currentPlayerId: string
): string => {
  const orderedIds = Object.keys(players);
  if (orderedIds.length === 0) {
    return "";
  }

  const startIndex = Math.max(orderedIds.indexOf(currentPlayerId), 0);

  for (let offset = 1; offset <= orderedIds.length; offset += 1) {
    const candidateId = orderedIds[(startIndex + offset) % orderedIds.length];
    if (players[candidateId]?.isAlive) {
      return candidateId;
    }
  }

  return currentPlayerId;
};
