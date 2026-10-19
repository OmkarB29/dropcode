# DropCode — Direct P2P File Sharing

> Share files between any two devices instantly using a short transfer code. No cloud storage. No account required.

[![Backend: Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Fastify-green)](./backend)
[![Frontend: Next.js](https://img.shields.io/badge/Frontend-Next.js%2015-black)](./frontend)
[![Transfer: WebRTC](https://img.shields.io/badge/Transfer-WebRTC%20P2P-blue)](./frontend/lib/webrtc.ts)

---

## How It Works

1. **Sender** opens the site, drops files, clicks **Generate Code** → gets a code like `FKJM-4827`
2. **Receiver** opens the site on another device, enters the code → sees the file list
3. Sender **approves** → a direct **WebRTC DataChannel** peer connection is established
4. Files transfer **directly between browsers** in 64 KB chunks — the server never touches the file data

---

## Project Structure

```
fileshare/
├── backend/           Node.js + Fastify + Socket.IO (signaling server)
├── frontend/          Next.js 15 + React + Tailwind + shadcn/ui
├── docker-compose.yml Run everything with one command
└── README.md
```

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- npm 9+

### 1. Start the Backend

```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:3001
```

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

Open **http://localhost:3000** in two browser tabs (or on two devices on the same network).

---

## Quick Start (Docker)

```bash
# Build and run both services
docker compose up --build

# Frontend → http://localhost:3000
# Backend  → http://localhost:3001
```

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Server port |
| `FRONTEND_URL` | `http://localhost:3000` | Allowed CORS origin |
| `SESSION_TTL_MS` | `600000` | Session timeout (10 min) |
| `SESSION_MAX_TTL_MS` | `1800000` | Max session lifetime (30 min) |
| `MAX_FILES_PER_SESSION` | `10` | Max files per transfer |
| `MAX_TOTAL_SIZE_BYTES` | `2147483648` | Max total transfer size (2 GB) |

### Frontend (`frontend/.env.local`)
| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | `http://localhost:3001` | Backend URL |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Frontend URL (for QR codes) |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 18, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | Node.js, Fastify v4, Socket.IO v4, TypeScript |
| Transfer | WebRTC DataChannel (P2P), server relay fallback |
| Real-time | Socket.IO WebSocket signaling |
| Session Store | In-memory Map with TTL cleanup |

---

## Transfer Architecture

```
SENDER BROWSER                SIGNALING SERVER              RECEIVER BROWSER
──────────────                ────────────────              ────────────────
Select files
Create session ──────────────→ Store session
                ←────────────── Code: FKJM-4827
                                                ←──────────── Enter code
                ←────────────── Receiver joined
Approve ────────────────────→ Notify receiver
                               (SDP offer/answer
                                ICE candidates)─────────────→
                ←─────────────────────────────────────────────
 [WebRTC DataChannel established — server no longer involved]
File chunks ─────────────────────────────────────────────────→ Auto-download
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server health + session count |
| `POST` | `/api/sessions` | Create a new transfer session |
| `GET` | `/api/sessions/:code` | Get session status by code |
| `POST` | `/api/sessions/:id/cancel` | Cancel an active session |

### Socket.IO Events

See [`backend/src/socket/`](./backend/src/socket/) for full event documentation.

---

## Security

- Sessions expire automatically (configurable TTL)
- Short codes are cryptographically generated (`crypto.randomBytes`)
- Rate limiting: 10 join attempts / 5 session creates per IP per minute
- Receiver requires explicit **sender approval** before any transfer starts
- No file data ever stored on the server (P2P via WebRTC DataChannel)
- Zod validation on all socket payloads
- CORS restricted to configured frontend origin

---

## Browser Support

| Browser | P2P Transfer | Notes |
|---|---|---|
| Chrome 90+ | ✅ | Full support |
| Edge 90+ | ✅ | Full support |
| Firefox 80+ | ✅ | Full support |
| Safari 15+ | ✅ | Full support |
| Chrome Android | ✅ | Full support |
| Safari iOS 15+ | ✅ | Full support |

> **Note:** Both devices must be able to reach the signaling server. Restrictive corporate firewalls or VPNs may block WebRTC. A TURN server can be configured for fallback connectivity.

---

## Customizing the Brand

The app name "DropCode" is isolated to:
- `frontend/lib/constants.ts` — `APP_NAME`
- `frontend/app/layout.tsx` — metadata title
- `backend/src/server.ts` — server name string

---

## License

MIT
