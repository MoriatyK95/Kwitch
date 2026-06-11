# Deployment

A production deployment has **two pieces**:

1. **Frontend** — the static Vite build (served over HTTPS, with an SPA
   fallback so deep links like `/watch/:id` survive a refresh).
2. **UserSig server** — the small Node service that signs UserSigs with your
   secret key.

This repo ships ready-made configs for every common path:

| Path | Files | Best for |
|---|---|---|
| **Docker Compose** | `docker-compose.yml`, `web/Dockerfile`, `server/Dockerfile` | One-command prod-like stack, any VPS/VM |
| **Render Blueprint** | `render.yaml` | One-click deploy of both services |
| **Vercel** | `web/vercel.json` | Frontend |
| **Netlify** | `web/netlify.toml` | Frontend |
| **Fly.io** | `server/fly.toml` | UserSig server |
| **Any container platform** | the two Dockerfiles | ECS, Cloud Run, Kubernetes, … |

CI (`.github/workflows/ci.yml`) lints, typechecks, tests, builds, and
docker-builds both pieces on every push/PR.

---

## 0. Prerequisites & the golden rules

- **HTTPS is mandatory for the frontend.** Browsers only allow camera/mic
  (`getUserMedia`) on a *secure context*. All hosted platforms below give you
  HTTPS automatically; for raw containers put a TLS-terminating proxy or CDN
  in front.
- **The secret key lives only on the server.** It is set as an environment
  variable / platform secret — never in the repo, never in the frontend build.
- **Set `VITE_USERSIG_MODE=server`** for the production frontend build, and
  leave `VITE_SDK_SECRET_KEY` blank. (The web Dockerfile deliberately has no
  build-arg for the secret key, so this mistake is impossible on that path.)

---

## 1. Quickest full stack: Docker Compose

```bash
cp .env.example .env        # fill in SDK_APP_ID and SDK_SECRET_KEY
docker compose up --build
# open http://localhost:8080
```

What you get:

- `web` — the Vite bundle built in **server mode** and served by hardened
  nginx (SPA fallback, gzip, immutable asset caching, security headers,
  `/healthz`) on port `8080`, running unprivileged.
- `usersig` — the signing API on port `3001`, non-root, with a Docker
  `HEALTHCHECK`, helmet, rate limiting, structured logs, and graceful
  shutdown.

For a real server, set `VITE_USERSIG_SERVER_URL` and `CORS_ORIGIN` in `.env`
to your public URLs and put both services behind HTTPS.

---

## 2. One-click: Render Blueprint

`render.yaml` defines both services:

1. Push the repo to GitHub → Render Dashboard → **New → Blueprint** → pick the
   repo.
2. Fill in the prompted secrets (`SDK_APP_ID`, `SDK_SECRET_KEY`,
   `VITE_SDK_APP_ID`).
3. After the first deploy, cross-wire the URLs (Render assigns them on first
   deploy): set `VITE_USERSIG_SERVER_URL` on **kwitch-web** to the
   **kwitch-usersig** URL, and `CORS_ORIGIN` on **kwitch-usersig** to the
   **kwitch-web** URL. Redeploy.
4. Verify: `curl https://<usersig-url>/healthz` → `{"ok":true,…}`.

---

## 3. Mix and match platforms

### UserSig server

Any Node host or container platform works. The server respects:

| Env var | Default | Purpose |
|---|---|---|
| `SDK_APP_ID` | — (required) | Your TRTC SDKAppID |
| `SDK_SECRET_KEY` | — (required) | Your TRTC SDKSecretKey (**secret**) |
| `PORT` | `3001` | Listen port |
| `CORS_ORIGIN` | `http://localhost:5173` | Comma-separated allowed frontend origins |
| `USERSIG_EXPIRE_SECONDS` | `3600` | Sig TTL |
| `RATE_LIMIT_PER_MINUTE` | `60` | `/usersig` requests per IP per minute |
| `TRUST_PROXY` | `false` | Set `true` behind a load balancer / reverse proxy |
| `LOG_LEVEL` | `info` | pino log level |
| `NODE_ENV` | `development` | `production` switches to JSON logs |

Probes: `GET /healthz` (liveness, `/health` kept as an alias) and
`GET /readyz` (readiness).

- **Render (manual):** root `server`, build `npm ci && npm run build`, start
  `npm start`, health check path `/healthz`, set the env vars, `TRUST_PROXY=true`.
- **Fly.io:** `cd server && fly launch --copy-config --no-deploy`, then
  `fly secrets set SDK_APP_ID=… SDK_SECRET_KEY=… CORS_ORIGIN=…` and `fly deploy`
  (uses `server/fly.toml` + `server/Dockerfile`).
- **Anything that runs containers:** `docker build -t kwitch-server ./server`.

> **CORS:** the server only accepts requests from the origins in `CORS_ORIGIN`
> (comma-separated). If your frontend can't reach `/usersig`, this is almost
> always the cause — the value must exactly match the deployed frontend origin
> (scheme + host, no trailing slash).

### Frontend

The build reads `VITE_*` from real environment variables **or**
`web/.env.local` (env vars win), so CI/cloud builds need no `.env` file:

| Env var | Production value |
|---|---|
| `VITE_SDK_APP_ID` | your SDKAppID |
| `VITE_USERSIG_MODE` | `server` |
| `VITE_USERSIG_SERVER_URL` | your UserSig server URL |
| `VITE_SDK_SECRET_KEY` | *(leave empty)* |

- **Vercel:** import repo, root `web` — `web/vercel.json` already configures
  the framework, SPA rewrites, and cache/security headers. Set the env vars.
- **Netlify:** base `web` — `web/netlify.toml` does the same. Set the env vars.
- **Cloudflare Pages:** root `web`, build `npm run build`, output `dist`, set
  the env vars, and add a SPA fallback (Pages serves `index.html` for unknown
  routes by default for SPAs).
- **Containers:** `docker build` with build args — see the header comment in
  `web/Dockerfile`. nginx listens on `8080` and exposes `/healthz`.

---

## 4. Wire them together

The frontend's `VITE_USERSIG_SERVER_URL` must point at the deployed server, and
the server's `CORS_ORIGIN` must include the deployed frontend origin.

```
Frontend (HTTPS)
   VITE_USERSIG_MODE=server
   VITE_USERSIG_SERVER_URL=https://usersig.example.com
            │  POST /usersig { userId }
            ▼
UserSig server (HTTPS)
   SDK_SECRET_KEY=••••  (server-only)
   CORS_ORIGIN=https://app.example.com
```

### WebRTC / secure-context notes

- Camera/mic require HTTPS — guaranteed by all hosted platforms above.
- TRTC uses WebRTC for media; the SDK negotiates UDP/TCP and falls back through
  Tencent's TURN relays, so you generally don't open custom ports. On locked-down
  corporate networks, ensure outbound UDP and `443` are permitted.

---

## 5. Production hardening checklist

Already done in this repo:

- [x] **Rate limiting** on `/usersig` (configurable via `RATE_LIMIT_PER_MINUTE`).
- [x] **Input validation** — `userId` restricted to a safe charset and length;
      request bodies capped at 4 KB.
- [x] **Security headers** — helmet on the API; nginx/Vercel/Netlify headers on
      the frontend.
- [x] **Structured JSON logging** (pino) with health-probe noise filtered out.
- [x] **Graceful shutdown** on SIGTERM/SIGINT for clean rolling deploys.
- [x] **Liveness/readiness probes** on both services.
- [x] **Non-root containers** with Docker `HEALTHCHECK`s.
- [x] **No secret in the client bundle** in server mode; CORS locked to your
      origins; secrets never logged.

Still on you (application-level decisions this demo can't make for you):

- [ ] **Authenticate the sig endpoint** — require the caller's own session/JWT
      and derive `userId` from it; don't trust a client-supplied `userId`.
- [ ] **Short sig TTL** — keep `USERSIG_EXPIRE_SECONDS` modest (e.g. 3600).
- [ ] **Rotate keys** — if a secret key is ever exposed, rotate it in the TRTC
      Console immediately.
- [ ] **Confirm the bundle is clean** — search the shipped JS for your secret
      key before going live (it must not be there).
- [ ] **Monitoring/alerting** — ship the JSON logs to your aggregator and alert
      on 5xx/429 rates.

---

## 6. The deploy/build scripts

**Frontend (`web/package.json`):**
- `npm run dev` — preflight check + Vite dev server.
- `npm run build` — preflight + typecheck + Vite production build → `web/dist`.
- `npm run preview` — serve the production build locally to sanity-check it.
- `npm run lint` / `lint:fix` / `typecheck` — what CI runs.

**Server (`server/package.json`):**
- `npm run dev` — `tsx watch` (hot-reload during development, pretty logs).
- `npm run build` — `tsc` → `server/dist`.
- `npm start` — run the compiled server (`node dist/index.js`).
- `npm test` — vitest + supertest integration tests.
