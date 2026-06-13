# 🎥 Kwitch — an open-source live-streaming platform

**Kwitch** is a Twitch/Kick-style live-streaming platform built on
[LiveKit](https://livekit.io/), with the "Aurora" design system (electric cyan →
violet on deep midnight blue) and production deploy paths: Docker Compose,
Cloudflare Workers, and optional Render.

- **Frontend**: Vue 3 + Vite + `livekit-client`
- **API server**: Node + Express — mints LiveKit JWTs, lists active rooms, exposes channel/moderation/analytics APIs
- **Deploy**: single-origin `/token` + `/streams` via nginx, Cloudflare Worker, or Vite dev proxy
- **Production model**: LiveKit WebRTC for interactive viewing; LiveKit Egress → HLS/LL-HLS → CDN for large passive fanout

---

## ⚡ Local quickstart

```bash
cp .env.example web/.env.local    # VITE_LIVEKIT_URL
cp .env.example server/.env         # LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET

cd web && npm install && npm run dev          # terminal 1
cd server && npm install && npm run dev       # terminal 2
```

Open `http://localhost:5173`, enter a display name, browse channels, or **Go Live**.
Use **Creator Studio** in the sidebar to inspect production readiness,
moderation settings, stream health, monetization placeholders, and the hybrid
WebRTC/HLS delivery plan from the PRD.

Creator Studio also now includes PRD-facing operational scaffolding:

- account/role profile
- RTMP/OBS stream key display + regeneration
- follower records with notification preferences
- AutoMod message evaluation
- trust & safety queue resolution

For Cloudflare local dev, also copy `web/.dev.vars.example` → `web/.dev.vars`.

---

## 🔑 LiveKit credentials

From [cloud.livekit.io](https://cloud.livekit.io) → your project → **Settings**:

| Variable | Example | Where |
|---|---|---|
| `LIVEKIT_URL` / `VITE_LIVEKIT_URL` | `wss://your-project.livekit.cloud` | frontend + server |
| `LIVEKIT_API_KEY` | `API…` | server / Worker only |
| `LIVEKIT_API_SECRET` | long secret | server / Worker only |

> Never commit real keys. Only `.env.example` is tracked.

---

## ☁️ Deploy

See **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for Cloudflare Workers, Docker Compose, and Render.

```bash
# Cloudflare
cd web && npx wrangler secret put LIVEKIT_API_SECRET
VITE_LIVEKIT_URL=wss://… npm run deploy

# Docker
cp .env.example .env && docker compose up --build
```

---

## 📁 Layout

```
web/src/livekit/     # token fetch, room connect, chat, stream list, platform API
web/worker/          # Cloudflare token + streams + platform API
server/src/          # Express token + streams + platform API
```

MIT — see [LICENSE](LICENSE).
