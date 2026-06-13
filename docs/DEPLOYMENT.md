# Deployment

Kwitch uses **LiveKit** for WebRTC media and a small **token API** on the same origin:

```
Browser ── HTTPS ──▶ web (nginx / Cloudflare Worker)
                      ├─ POST /token, GET /streams  → API (JWT signing)
                      └─ /*                         → Vue SPA
                      room.connect(VITE_LIVEKIT_URL, token) → LiveKit Cloud
```

## Environment

### Frontend (`web/.env.local`)

| Variable | Purpose |
|---|---|
| `VITE_LIVEKIT_URL` | LiveKit WebSocket URL (`wss://…`) |
| `VITE_TOKEN_SERVER_URL` | Empty = same-origin `/token` |

### API server (`server/.env`)

| Variable | Purpose |
|---|---|
| `LIVEKIT_URL` | Same `wss://…` URL |
| `LIVEKIT_API_KEY` | LiveKit API key |
| `LIVEKIT_API_SECRET` | LiveKit API secret (**never in frontend**) |
| `TOKEN_EXPIRE_SECONDS` | JWT TTL (default 3600) |

### Cloudflare Worker (`web/.dev.vars`)

Same as API server (`LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`).

Production: `npx wrangler secret put LIVEKIT_API_SECRET`

---

## 1. Cloudflare Workers

```bash
cd web
cp .dev.vars.example .dev.vars   # local dev only
npx wrangler login
npx wrangler secret put LIVEKIT_API_SECRET
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud npm run deploy
```

`wrangler.jsonc` routes `/token`, `/streams`, and `/room-metadata` to the Worker first.

---

## 2. Docker Compose

```bash
cp .env.example .env   # LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET
docker compose up --build
# http://localhost:8080
```

Services: `api` (token server, internal) + `web` (nginx + SPA).

---

## 3. Local development

```bash
# terminal 1 — API
cd server && npm run dev

# terminal 2 — frontend (proxies /token → localhost:3001)
cd web && npm run dev
```

---

## API endpoints

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/token` | `{ identity, name, roomName, role }` | `{ token, url }` |
| GET | `/streams` | — | `{ streams: StreamInfo[] }` |
| POST | `/room-metadata` | `{ roomName, title, hostId, hostName }` | `{ ok: true }` |

Roles: `host` (publish), `viewer` (subscribe), `guest` (publish after host accept).

---

## Security checklist

- [x] API secret only on server / Worker
- [x] Rate limiting on `/token`
- [x] Input validation on identity and room names
- [ ] Authenticate `/token` — derive identity from your session/JWT before production
