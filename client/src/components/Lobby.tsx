import { useState } from "react";
import type { FormEvent } from "react";

type LobbyMode = "choose" | "create" | "join";

interface LobbyProps {
  playerName: string;
  roomId: string;
  aiCount: number;
  isConnected: boolean;
  errorMessage: string;
  onNameChange: (value: string) => void;
  onRoomIdChange: (value: string) => void;
  onAiCountChange: (value: number) => void;
  onCreateRoom: () => void;
  onJoinRoom: (event: FormEvent<HTMLFormElement>) => void;
}

export const Lobby = ({
  playerName,
  roomId,
  aiCount,
  isConnected,
  errorMessage,
  onNameChange,
  onRoomIdChange,
  onAiCountChange,
  onCreateRoom,
  onJoinRoom,
}: LobbyProps): JSX.Element => {
  const [mode, setMode] = useState<LobbyMode>("choose");

  const nameField = (
    <label className="flex flex-col gap-2 text-sm">
      <span className="text-slate-300">Nickname</span>
      <input
        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
        placeholder="Your name"
        value={playerName}
        onChange={(event) => onNameChange(event.target.value)}
      />
    </label>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 p-6">
        <div>
          <h1 className="text-3xl font-semibold">Coup Lobby</h1>
          <p className="text-sm text-slate-400">{isConnected ? "Connected" : "Not connected"}</p>
        </div>

        {mode === "choose" && (
          <div className="flex gap-3">
            <button className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-900" type="button" onClick={() => setMode("create")}>Create Room</button>
            <button className="flex-1 rounded-lg bg-slate-700 px-4 py-2 font-semibold text-slate-100" type="button" onClick={() => setMode("join")}>Join Room</button>
          </div>
        )}

        {mode === "create" && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Create Room</div>
            <div className="mt-4 flex flex-col gap-4">
              {nameField}
              <div className="flex items-center justify-between gap-3 text-sm text-slate-300">
                <span>AI Players</span>
                <select className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100" value={aiCount} onChange={(event) => onAiCountChange(Number(event.target.value))}>
                  {[0, 1, 2, 3, 4, 5].map((count) => (
                    <option key={count} value={count}>{count}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-900" type="button" onClick={onCreateRoom}>Create</button>
              <button className="flex-1 rounded-lg bg-slate-700 px-4 py-2 font-semibold text-slate-100" type="button" onClick={() => setMode("choose")}>Back</button>
            </div>
          </div>
        )}

        {mode === "join" && (
          <form className="rounded-xl border border-slate-800 bg-slate-900/60 p-4" onSubmit={onJoinRoom}>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Join Room</div>
            <div className="mt-4 flex flex-col gap-4">
              {nameField}
              <label className="flex flex-col gap-2 text-sm">
                <span className="text-slate-300">Room Code</span>
                <input
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                  placeholder="Room code"
                  value={roomId}
                  onChange={(event) => onRoomIdChange(event.target.value)}
                />
              </label>
              {errorMessage && (
                <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  {errorMessage}
                </div>
              )}
            </div>
            <div className="mt-5 flex gap-3">
              <button className="flex-1 rounded-lg bg-slate-700 px-4 py-2 font-semibold text-slate-100" type="submit">Join</button>
              <button className="flex-1 rounded-lg bg-slate-800 px-4 py-2 font-semibold text-slate-200" type="button" onClick={() => setMode("choose")}>Back</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
