# Algo Royale (clash code)

1v1 competitive programming with sabotage mechanics. Solve algorithm problems while disrupting your opponent.

## Quick Start

1. **Install dependencies**

```bash
npm install
cd server && npm install && cd ..
```

2. **Start the backend server** (in one terminal)

```bash
npm run dev:server
```

3. **Start the frontend** (in another terminal)

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Code Execution

Uses the **Piston public API** (free, no API key required) at [emkc.org](https://emkc.org/api/v2/piston).

To use a self-hosted Piston instance, set `PISTON_API_URL` in `server/.env`.

## Configuration

### Frontend (`/`)

- `NEXT_PUBLIC_SOCKET_URL` - Backend URL (default: http://localhost:4000)

### Backend (`/server`)

- `PORT` - Server port (default: 4000)
- `FRONTEND_URL` - CORS origin (default: http://localhost:3000)
- `PISTON_API_URL` - Piston API base URL (default: https://emkc.org/api/v2/piston)

## Deploy on Render (manual setup)

Create two **Web Services** in the [Render Dashboard](https://dashboard.render.com):

### 1. Backend (clash-code-server)

- **New → Web Service** → connect your repo
- **Root Directory**: `server`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment variables**:
  - `FRONTEND_URL` — your frontend URL (set after creating it, e.g. `https://clash-code.onrender.com`)
  - `SUPABASE_URL` — your Supabase project URL
  - `SUPABASE_SERVICE_KEY` — your Supabase service role key
- Deploy and copy the service URL (e.g. `https://clash-code-server-xxxx.onrender.com`)

### 2. Frontend (clash-code)

- **New → Web Service** → same repo
- **Root Directory**: leave empty (repo root)
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment variables**:
  - `NEXT_PUBLIC_SOCKET_URL` — backend URL from step 1
  - `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your Supabase anon key
- Deploy and copy the frontend URL

### 3. Wire URLs

Go back to the backend service and set `FRONTEND_URL` to your frontend URL, then redeploy the backend.

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind, NES.css, Monaco Editor, Socket.io
- **Backend**: Express, Socket.io
- **Execution**: Piston public API (C++ only for MVP)

## Game Flow

1. Create or join a room with a 6-digit code
2. Host configures difficulty and starts the game
3. Best of 3 rounds - first to pass sample tests wins each round
4. Use Mana to play sabotage cards: Blind, Freeze, Shield
5. First to win 2 rounds wins the game
