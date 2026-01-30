import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { GameState } from "../../shared/types";
import {
  ActionControls,
  ActionControlPayload,
} from "./components/ActionControls";
import { GameTable } from "./components/GameTable";
import { DeckInspector } from "./components/DeckInspector";
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
  const showDebug = import.meta.env.VITE_DEBUG_MODE === "true";
  const [showDeck, setShowDeck] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-slate-900 text-slate-100">
      <div className="relative flex flex-1 min-h-0 flex-col">
        <button
          className="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/90 text-slate-100 shadow-lg"
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Menu"
        >
          <div className="flex flex-col gap-1">
            <span className="block h-0.5 w-5 bg-slate-100" />
            <span className="block h-0.5 w-5 bg-slate-100" />
            <span className="block h-0.5 w-5 bg-slate-100" />
          </div>
        </button>

        {menuOpen && (
          <div className="absolute right-4 top-16 z-30 w-56 rounded-xl bg-slate-900/95 p-4 shadow-xl">
            <div className="text-xs uppercase tracking-wide text-slate-400">Room</div>
            <div className="mb-3 text-sm font-semibold text-slate-100">{roomId || "unknown"}</div>
            {showDebug && (
              <button className="mb-2 w-full rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200" type="button" onClick={() => setShowDeck((prev) => !prev)}>
                {showDeck ? "Hide Deck" : "Show Deck"}
              </button>
            )}
            <button className="w-full rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200" type="button" onClick={handleLeaveRoom}>Leave Room</button>
          </div>
        )}

        <div className="flex-1 min-h-0">
          <GameTable
            gameState={gameState}
            localPlayerId={localPlayerId}
            actionControls={
              <ActionControls
                gameState={gameState}
                myPlayerId={localPlayerId}
                onAction={handleAction}
              />
            }
          />
        </div>

        {showDebug && showDeck && (
          <div className="absolute bottom-4 right-4 z-30 w-64">
            <DeckInspector deck={gameState.deck} />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
