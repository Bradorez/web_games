# Coup Web Games

A small real-time web games project built with React, Vite, TypeScript, Express, and Socket.IO.

The app currently includes:

- **Coup**: multiplayer rooms with live turns, challenges, blocks, card exchange, reconnect handling, optional AI players, and masked private hands.
- **Battleship**: two-player rooms with ship placement, masked boards, turn timers, shots, restart support, and room logs.
- **Flashcards**: a local solo study mode where users can create cards or upload JSON, CSV, or tab-separated decks.

Rooms are stored in server memory. Restarting the server clears active rooms.

## Project Structure

```text
.
|-- client/   # Vite + React frontend
|-- server/   # Express + Socket.IO game server
`-- shared/   # Shared TypeScript game types used by the client
```

Notable areas:

- `client/src/App.tsx` selects the game mode and wires room/session state.
- `client/src/services/socketService.ts` contains client Socket.IO events and local session storage helpers.
- `client/src/flashcards/FlashcardsGame.tsx` contains the local flashcard creator, importer, and study UI.
- `server/src/socket/handlers.ts` contains Coup room and action socket handlers.
- `server/src/socket/battleshipHandlers.ts` contains Battleship socket handlers.
- `server/src/engine/` contains Coup game rules and turn/challenge resolution.
- `server/src/battleship/` contains Battleship state and game logic.
- `shared/types.ts` and `server/shared/types.ts` define the shared game state contracts.

## Requirements

- Node.js 18 or newer
- npm

The repository uses separate npm projects for the client and server. There is no root workspace script.

## Setup

Install dependencies for both apps:

```bash
cd server
npm install

cd ../client
npm install
```

Create environment files if needed.

`server/.env`:

```env
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
DEBUG_DECK=false
```

`client/.env`:

```env
VITE_SERVER_URL=http://localhost:3001
VITE_DEBUG_MODE=false
```

## Running Locally

Start the server in one terminal:

```bash
cd server
npm run dev
```

Start the client in another terminal:

```bash
cd client
npm run dev
```

Then open the Vite URL, usually:

```text
http://localhost:5173
```

The app can also open directly into a game selector route with query params:

- `http://localhost:5173/?game=coup`
- `http://localhost:5173/?game=battleship`
- `http://localhost:5173/?game=flashcards`

The previous `?game=questionary` route is still accepted as a backwards-compatible alias for flashcards.

## Available Scripts

Client scripts:

```bash
cd client
npm run dev      # Start Vite dev server
npm run build    # Type-check and build production assets
npm run preview  # Preview the production build
```

Server scripts:

```bash
cd server
npm run dev        # Start server with tsx watch
npm run start      # Start server once with tsx
npm run typecheck  # Run TypeScript type-checking
```

## Environment Variables

Server:

- `PORT`: HTTP and Socket.IO port. Defaults to `3001`.
- `CLIENT_ORIGIN`: allowed browser origin for Socket.IO CORS. Defaults to `http://localhost:5173`. Use a comma-separated list for multiple origins, or `*` for any origin.
- `DEBUG_DECK`: when set to `true`, the server includes the real Coup deck in emitted state instead of masking it.

Client:

- `VITE_SERVER_URL`: Socket.IO server URL. Defaults to `http://localhost:3001`.
- `VITE_DEBUG_MODE`: when set to `true`, shows the in-game Coup debug deck toggle. To see real deck cards, `DEBUG_DECK=true` must also be set on the server.

## Game Notes

### Coup

- A host creates a private room and can add 0-5 AI players.
- Other players join with the room code before the game starts.
- Hands are masked per player on the server before state is emitted.
- If a live player disconnects during a started game, the room pauses until they reconnect.
- The host can restart or end the room from the game controls.

### Battleship

- Rooms support two players.
- Each player places the classic fleet sizes: `5, 4, 3, 3, 2`.
- Boards are masked so each player only sees their own ships and public shot results.
- Turns expire after 30 seconds.
- The host can restart the match.

### Flashcards

- Runs fully in the client.
- Users can create cards manually or upload JSON, CSV, or tab-separated text.
- Decks are saved in browser localStorage.
- No server room is required.

Supported JSON imports can be either an array or an object with a `cards`, `flashcards`, or `questions` array:

```json
[
  {
    "front": "What does HTTP stand for?",
    "back": "Hypertext Transfer Protocol"
  }
]
```

The importer also accepts `prompt` or `question` as the front field, and `answer` or `answers` as the back field. CSV and tab-separated uploads use one card per line:

```text
What does CSS stand for?,Cascading Style Sheets
What does HTML stand for?	HyperText Markup Language
```

## Development Notes

- The server keeps all room state in process memory; use a shared store if you need persistence or multiple server instances.
- Socket event payloads are typed through the shared TypeScript state definitions, but there is no runtime schema validation layer.
- There are currently no automated test scripts. Use `npm run build` in `client` and `npm run typecheck` in `server` as the baseline verification commands.
