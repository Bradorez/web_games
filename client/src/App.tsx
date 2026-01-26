import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { GameState } from "../../shared/types";
import { GameTable } from "./components/GameTable";
import { joinGame, sendAction, socket } from "./services/socketService";

const App = (): JSX.Element => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [localPlayerId, setLocalPlayerId] = useState("");

  useEffect(() => {
    const handleGameUpdate = (state: GameState) => setGameState(state);
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on("game_state_update", handleGameUpdate);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("game_state_update", handleGameUpdate);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  const handleJoin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!roomId || !playerName) {
      return;
    }
    const playerId = joinGame(roomId.trim(), playerName.trim());
    setLocalPlayerId(playerId);
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 p-6">
          <div>
            <h1 className="text-3xl font-semibold">Coup Lobby</h1>
            <p className="text-sm text-slate-400">
              {isConnected ? "Connected" : "Not connected"}
            </p>
          </div>
          <form className="flex flex-col gap-4" onSubmit={handleJoin}>
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-slate-300">Player Name</span>
              <input
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                placeholder="Your name"
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-slate-300">Room ID</span>
              <input
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                placeholder="Room code"
                value={roomId}
                onChange={(event) => setRoomId(event.target.value)}
              />
            </label>
            <button
              className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-900"
              type="submit"
            >
              Join Game
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-400">Room: {roomId || "unknown"}</div>
          <button
            className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-900"
            onClick={() => sendAction({ type: "INCOME" })}
            type="button"
          >
            Take Income
          </button>
        </div>
        <GameTable gameState={gameState} localPlayerId={localPlayerId} />
      </div>
    </div>
  );
};

export default App;
