import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { GameState } from "../../shared/types";
import {
  ActionControls,
  ActionControlPayload,
} from "./components/ActionControls";
import { GameTable } from "./components/GameTable";
import { Lobby } from "./components/Lobby";
import {
  createRoom,
  getSavedSession,
  joinRoom,
  saveSession,
  sendAction,
  socket,
} from "./services/socketService";

const App = (): JSX.Element => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [localPlayerId, setLocalPlayerId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const handleGameUpdate = (state: GameState) => setGameState(state);
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleRoomCreated = (payload: { roomId: string }) => {
      setRoomId(payload.roomId);
      if (localPlayerId) {
        saveSession(payload.roomId, localPlayerId, playerName);
      }
    };
    const handleRoomError = (payload: { message: string }) => {
      setErrorMessage(payload.message);
    };

    socket.on("game_state_update", handleGameUpdate);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("room_created", handleRoomCreated);
    socket.on("room_error", handleRoomError);

    return () => {
      socket.off("game_state_update", handleGameUpdate);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("room_created", handleRoomCreated);
      socket.off("room_error", handleRoomError);
    };
  }, [localPlayerId, playerName]);

  useEffect(() => {
    const saved = getSavedSession();
    if (!saved || gameState || localPlayerId) {
      return;
    }
    setRoomId(saved.roomId);
    setPlayerName(saved.playerName);
    const playerId = joinRoom(saved.roomId, saved.playerName);
    setLocalPlayerId(playerId);
  }, [gameState, localPlayerId]);

  const handleJoin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!roomId || !playerName) {
      return;
    }
    const trimmedRoom = roomId.trim();
    const trimmedName = playerName.trim();
    const playerId = joinRoom(trimmedRoom, trimmedName);
    setLocalPlayerId(playerId);
    saveSession(trimmedRoom, playerId, trimmedName);
    setErrorMessage("");
  };

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      return;
    }
    const trimmedName = playerName.trim();
    const playerId = createRoom(trimmedName);
    setLocalPlayerId(playerId);
    setErrorMessage("");
  };

  const handleAction = (payload: ActionControlPayload) => {
    sendAction(payload);
  };

  if (!gameState) {
    return (
      <Lobby
        playerName={playerName}
        roomId={roomId}
        isConnected={isConnected}
        errorMessage={errorMessage}
        onNameChange={setPlayerName}
        onRoomIdChange={setRoomId}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoin}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-400">Room: {roomId || "unknown"}</div>
        </div>
        <GameTable gameState={gameState} localPlayerId={localPlayerId} />
        <ActionControls
          gameState={gameState}
          myPlayerId={localPlayerId}
          onAction={handleAction}
        />
      </div>
    </div>
  );
};

export default App;
