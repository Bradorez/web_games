import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { BattleshipState, GameState } from "../../shared/types";
import {
  ActionControls,
  ActionControlPayload,
} from "./components/ActionControls";
import { GameTable } from "./components/GameTable";
import { DeckInspector } from "./components/DeckInspector";
import { Lobby } from "./components/Lobby";
import { BattleshipGame } from "./battleship/BattleshipGame";
import { BattleshipLobby } from "./battleship/BattleshipLobby";
import { QuestionaryGame } from "./questionary/QuestionaryGame";
import {
  clearSession,
  clearBattleshipSession,
  createRoom,
  createBattleshipRoom,
  getSavedSession,
  getSavedBattleshipSession,
  joinRoom,
  joinBattleshipRoom,
  leaveRoom,
  leaveBattleshipRoom,
  saveSession,
  saveBattleshipSession,
  placeBattleshipShips,
  fireBattleship,
  restartBattleship,
  sendAction,
  socket,
} from "./services/socketService";

const App = (): JSX.Element => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [battleshipState, setBattleshipState] = useState<BattleshipState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedGame, setSelectedGame] = useState<"coup" | "battleship" | "questionary" | null>(null);
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
        if (selectedGame === "battleship") {
          saveBattleshipSession(payload.roomId, activePlayerId, playerName);
        } else {
          saveSession(payload.roomId, activePlayerId, playerName);
        }
      }
    };
    const handleRoomError = (payload: { message: string }) => {
      setErrorMessage(payload.message);
    };
    const handleRoomEnded = () => {
      if (roomId) {
        clearSession(roomId);
        clearBattleshipSession(roomId);
      }
      setGameState(null);
      setBattleshipState(null);
      setRoomId("");
      setLocalPlayerId("");
      lastPlayerIdRef.current = "";
      setSelectedGame(null);
    };

    socket.on("game_state_update", handleGameUpdate);
    socket.on("battleship_state_update", setBattleshipState);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("room_created", handleRoomCreated);
    socket.on("room_error", handleRoomError);
    socket.on("room_ended", handleRoomEnded);

    return () => {
      socket.off("game_state_update", handleGameUpdate);
      socket.off("battleship_state_update", setBattleshipState);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("room_created", handleRoomCreated);
      socket.off("room_error", handleRoomError);
      socket.off("room_ended", handleRoomEnded);
    };
  }, [localPlayerId, playerName, roomId, selectedGame]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const game = params.get("game");
    if (game === "questionary") {
      setSelectedGame("questionary");
    } else if (game === "battleship") {
      setSelectedGame("battleship");
    } else if (game === "coup") {
      setSelectedGame("coup");
    }
  }, []);

  useEffect(() => {
    if (selectedGame !== "coup") {
      return;
    }
    const saved = getSavedSession();
    if (!saved || gameState || localPlayerId) {
      return;
    }
    setRoomId(saved.roomId);
    setPlayerName(saved.playerName);
    const playerId = joinRoom(saved.roomId, saved.playerName);
    setLocalPlayerId(playerId);
  }, [gameState, localPlayerId, selectedGame]);

  useEffect(() => {
    if (selectedGame !== "battleship") {
      return;
    }
    const saved = getSavedBattleshipSession();
    if (!saved || battleshipState || localPlayerId) {
      return;
    }
    setRoomId(saved.roomId);
    setPlayerName(saved.playerName);
    const playerId = joinBattleshipRoom(saved.roomId, saved.playerName);
    setLocalPlayerId(playerId);
  }, [battleshipState, localPlayerId, selectedGame]);

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
    setSelectedGame("coup");
  };

  const handleCreateBattleshipRoom = () => {
    if (!playerName.trim()) {
      return;
    }
    const trimmedName = playerName.trim();
    setSelectedGame("battleship");
    const playerId = createBattleshipRoom(trimmedName);
    setLocalPlayerId(playerId);
    lastPlayerIdRef.current = playerId;
    setErrorMessage("");
  };

  const handleAction = (payload: ActionControlPayload) => {
    sendAction(payload);
  };

  const handleLeaveRoom = () => {
    if (selectedGame === "battleship") {
      leaveBattleshipRoom();
    } else {
      leaveRoom();
    }
    if (roomId) {
      clearSession(roomId);
      clearBattleshipSession(roomId);
    }
    setGameState(null);
    setBattleshipState(null);
    setRoomId("");
    setLocalPlayerId("");
    lastPlayerIdRef.current = "";
    setSelectedGame(null);
  };

  if (!gameState && !battleshipState && !selectedGame) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-10 px-6 py-12">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Web Games</p>
            <h1 className="mt-3 text-4xl font-semibold">Choose a game</h1>
            <p className="mt-2 text-sm text-slate-400">Pick a game to start a private room.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setSelectedGame("coup")}
              className="group rounded-2xl border border-emerald-500/40 bg-slate-900/70 p-6 text-left shadow-lg transition hover:border-emerald-400 hover:shadow-emerald-500/20"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-emerald-200">Coup</h2>
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                  Available
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-300">
                Bluff, challenge, and outsmart your friends in the classic coup room.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-200">
                Play now
                <span className="text-lg">→</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedGame("battleship")}
              className="group rounded-2xl border border-sky-500/40 bg-slate-900/70 p-6 text-left shadow-lg transition hover:border-sky-400 hover:shadow-sky-500/20"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-sky-200">Battleship</h2>
                <span className="rounded-full bg-sky-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-200">
                  Available
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-300">
                Place your fleet and duel another player in a classic 10×10 battle.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-sky-200">
                Play now
                <span className="text-lg">→</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedGame("questionary")}
              className="group rounded-2xl border border-amber-500/40 bg-slate-900/70 p-6 text-left shadow-lg transition hover:border-amber-400 hover:shadow-amber-500/20"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-amber-200">Questionary</h2>
                <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-200">
                  Solo
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-300">
                Flip question cards, think of your answer, then reveal the prompt.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-amber-200">
                Play now
                <span className="text-lg">→</span>
              </div>
            </button>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-left opacity-60 md:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-slate-200">More games</h2>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300">
                  Soon
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-400">
                Additional multiplayer games are coming next. Stay tuned.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!gameState && selectedGame === "coup") {
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

  if (!battleshipState && selectedGame === "battleship") {
    return (
      <BattleshipLobby
        playerName={playerName}
        roomId={roomId}
        isConnected={isConnected}
        errorMessage={errorMessage}
        onNameChange={setPlayerName}
        onRoomIdChange={setRoomId}
        onCreateRoom={handleCreateBattleshipRoom}
        onJoinRoom={(event) => {
          event.preventDefault();
          if (!roomId || !playerName) {
            return;
          }
          const trimmedRoom = roomId.trim();
          const trimmedName = playerName.trim();
          const playerId = joinBattleshipRoom(trimmedRoom, trimmedName);
          setLocalPlayerId(playerId);
          lastPlayerIdRef.current = playerId;
          saveBattleshipSession(trimmedRoom, playerId, trimmedName);
          setErrorMessage("");
        }}
        onBack={() => setSelectedGame(null)}
      />
    );
  }

  if (battleshipState) {
    return (
      <BattleshipGame
        state={battleshipState}
        localPlayerId={localPlayerId}
        onPlaceShips={placeBattleshipShips}
        onFire={fireBattleship}
        onRestart={restartBattleship}
        onLeave={handleLeaveRoom}
      />
    );
  }

  if (selectedGame === "questionary") {
    return <QuestionaryGame onBack={() => setSelectedGame(null)} />;
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
            roomId={roomId}
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
