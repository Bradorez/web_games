import type { FormEvent } from "react";

interface LobbyProps {
  playerName: string;
  roomId: string;
  isConnected: boolean;
  errorMessage: string;
  onNameChange: (value: string) => void;
  onRoomIdChange: (value: string) => void;
  onCreateRoom: () => void;
  onJoinRoom: (event: FormEvent<HTMLFormElement>) => void;
}

export const Lobby = ({
  playerName,
  roomId,
  isConnected,
  errorMessage,
  onNameChange,
  onRoomIdChange,
  onCreateRoom,
  onJoinRoom,
}: LobbyProps): JSX.Element => (
  <div className="min-h-screen bg-slate-950 text-slate-100">
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-3xl font-semibold">Coup Lobby</h1>
        <p className="text-sm text-slate-400">
          {isConnected ? "Connected" : "Not connected"}
        </p>
      </div>
      <form className="flex flex-col gap-4" onSubmit={onJoinRoom}>
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-300">Player Name</span>
          <input
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            placeholder="Your name"
            value={playerName}
            onChange={(event) => onNameChange(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-300">Room ID</span>
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
        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-900"
            type="button"
            onClick={onCreateRoom}
          >
            Create Room
          </button>
          <button
            className="rounded-lg bg-slate-700 px-4 py-2 font-semibold text-slate-100"
            type="submit"
          >
            Join Room
          </button>
        </div>
      </form>
    </div>
  </div>
);
