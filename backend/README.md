# DropCode Backend

DropCode backend is a real-time WebRTC signaling and session coordination service built with Node.js, TypeScript, Fastify, and Socket.IO.

## Features
- **Fastify HTTP Server**: High-throughput REST API with CORS and rate-limiting.
- **Socket.IO Real-time Signaling**: Coordinates WebSockets for WebRTC SDP offer/answer exchange, ICE candidates, and session events.
- **In-Memory Session Store**: Efficient Map-based store with 60-second TTL cleanup and expiring-soon event notifications.
- **Secure Code Generation**: Short human-readable codes (`XXXX-NNNN`) with collision avoidance and entropy from `crypto.randomBytes`.
- **Relay Fallback**: Built-in fallback endpoint `/api/sessions/:id/relay` for environments where direct P2P connections are restricted.
- **Device Sanitization & Zod Validation**: Strict validation and sanitization on all incoming payloads and device names.

## Getting Started

### Prerequisites
- Node.js >= 20.0.0
- npm >= 9.0.0

### Installation
```bash
npm install
```

### Environment Variables
Copy `.env.example` to `.env` (or configure environment variables):
```ini
PORT=3001
FRONTEND_URL=http://localhost:3000
SESSION_TTL_MS=600000
SESSION_MAX_TTL_MS=1800000
MAX_FILES_PER_SESSION=10
MAX_TOTAL_SIZE_BYTES=2147483648
NODE_ENV=development
```

### Running Locally
Development mode with hot reload:
```bash
npm run dev
```

Production build & run:
```bash
npm run build
npm start
```

### Running with Docker
```bash
docker build -t dropcode-backend .
docker run -p 3001:3001 --env-file .env dropcode-backend
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check endpoint returning uptime and active sessions |
| `POST` | `/api/sessions` | Create a new file-sharing session |
| `GET` | `/api/sessions/:code` | Retrieve public session status by code (no sensitive socket IDs) |
| `POST` | `/api/sessions/:id/cancel` | Cancel an active session |
| `POST` | `/api/sessions/:id/relay` | Fallback chunk relay endpoint |

## Socket.IO Events

### Sender Events (Client -> Server)
- `sender:create-session`
- `sender:join`
- `sender:approve-receiver`
- `sender:reject-receiver`
- `sender:cancel`
- `sender:webrtc-signal`
- `sender:transfer-complete`

### Receiver Events (Client -> Server)
- `receiver:join`
- `receiver:accept`
- `receiver:reject`
- `receiver:webrtc-signal`
- `receiver:transfer-complete`

### Server Dispatched Events
- `session:receiver-joined`
- `session:sender-disconnected`
- `session:receiver-disconnected`
- `session:expiring-soon`
- `session:expired`
- `transfer:approved`
- `transfer:rejected`
- `transfer:cancelled`
- `sender:webrtc-signal`
- `receiver:webrtc-signal`
- `relay:chunk`
