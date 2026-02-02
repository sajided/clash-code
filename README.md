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

## Deploy on Render

1. **Connect your repo** to [Render](https://render.com) and create a **Blueprint** (it will use `render.yaml`).

2. **Set environment variables** when prompted (or in each service’s dashboard):

   | Service | Variable | Value |
   |---------|----------|-------|
   | clash-code (frontend) | `NEXT_PUBLIC_SOCKET_URL` | Your backend URL, e.g. `https://clash-code-server.onrender.com` |
   | clash-code | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
   | clash-code | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
   | clash-code-server (backend) | `FRONTEND_URL` | Your frontend URL, e.g. `https://clash-code.onrender.com` |
   | clash-code-server | `SUPABASE_URL` | Same as above |
   | clash-code-server | `SUPABASE_SERVICE_KEY` | Your Supabase service role key |

3. **First deploy**: deploy both services, note the URLs, then set `NEXT_PUBLIC_SOCKET_URL` and `FRONTEND_URL` and redeploy if needed.

4. **Optional**: add `PISTON_API_URL` to the server if using a custom Piston instance.

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
