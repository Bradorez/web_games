import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { GameState } from "../../shared/types";
import {
  ActionControls,
  ActionControlPayload,
} from "./components/ActionControls";
import { GameTable } from "./components/GameTable";
import { Lobby } from "./components/Lobby";
import {
  clearSession,
  createRoom,
  getSavedSession,
  joinRoom,
  leaveRoom,
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
  const [aiCount, setAiCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const lastPlayerIdRef = useRef("");

  useEffect(() => {
    const handleGameUpdate = (state: GameState) => setGameState(state);
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleRoomCreated = (payload: { roomId: string }) => {
      setRoomId(payload.roomId);
      const activePlayerId = lastPlayerIdRef.current || localPlayerId;
      if (activePlayerId) {
        saveSession(payload.roomId, activePlayerId, playerName);
      }
    };
    const handleRoomError = (payload: { message: string }) => {
      setErrorMessage(payload.message);
    };
    const handleRoomEnded = () => {
      if (roomId) {
        clearSession(roomId);
      }
      setGameState(null);
      setRoomId("");
      setLocalPlayerId("");
      lastPlayerIdRef.current = "";
    };

    socket.on("game_state_update", handleGameUpdate);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("room_created", handleRoomCreated);
    socket.on("room_error", handleRoomError);
    socket.on("room_ended", handleRoomEnded);

    return () => {
      socket.off("game_state_update", handleGameUpdate);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("room_created", handleRoomCreated);
      socket.off("room_error", handleRoomError);
      socket.off("room_ended", handleRoomEnded);
    };
  }, [localPlayerId, playerName, roomId]);

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
    lastPlayerIdRef.current = playerId;
    saveSession(trimmedRoom, playerId, trimmedName);
    setErrorMessage("");
  };

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      return;
    }
    const trimmedName = playerName.trim();
    const playerId = createRoom(trimmedName, aiCount);
    setLocalPlayerId(playerId);
    lastPlayerIdRef.current = playerId;
    setErrorMessage("");
  };

  const handleAction = (payload: ActionControlPayload) => {
    sendAction(payload);
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    if (roomId) {
      clearSession(roomId);
    }
    setGameState(null);
    setRoomId("");
    setLocalPlayerId("");
    lastPlayerIdRef.current = "";
  };

  if (!gameState) {
    return (
      <Lobby
        playerName={playerName}
        roomId={roomId}
        aiCount={aiCount}
        isConnected={isConnected}
        errorMessage={errorMessage}
        onNameChange={setPlayerName}
        onRoomIdChange={setRoomId}
        onAiCountChange={setAiCount}
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
          <button className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200" type="button" onClick={handleLeaveRoom}>Leave Room</button>
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
