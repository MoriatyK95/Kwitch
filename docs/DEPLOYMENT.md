# Deployment

Kwitch deploys as **one stack with one public origin**:

```
                        ┌────────────────────────────────────────────┐
Browser ── HTTPS ──────▶│  web (nginx or Cloudflare Workers)         │
                        │   • serves the Vite bundle (SPA fallback)  │
                        │   • handles POST /usersig on same origin   │
                        │     (nginx proxy → Node, or Worker script) │
                        └────────────────────────────────────────────┘
```

Because the browser only ever talks to one origin, there is **no CORS setup,
no URL cross-wiring, and no second public hostname**. The SDKSecretKey never
leaves the signing layer (Node container or Cloudflare Worker secret).

There are **three supported deploy paths** — pick one:

| Path | Vendors involved | Best for |
|---|---|---|
| **1. Cloudflare Workers** (recommended managed) | one — Cloudflare | HTTPS, CDN, zero server admin, same-origin API |
| **2. Docker Compose** | none — any Docker host | A VPS/VM you already have; full control |
| **3. Render Blueprint** (optional) | one — Render | Managed hosting if you prefer Render over Cloudflare |

CI (`.github/workflows/ci.yml`) lints, typechecks, tests, builds, and
docker-builds everything on every push/PR — it runs on GitHub, which already
hosts the repo, so it adds no extra vendor.

---

## 0. The golden rules

- **HTTPS is mandatory for the frontend.** Browsers only allow camera/mic
  (`getUserMedia`) on a *secure context*. `localhost` counts, so local runs
  work over plain HTTP; for a real deployment put TLS in front (Caddy,
  Traefik, a load balancer, or your CDN). Cloudflare and Render do this
  automatically.
- **The secret key lives only on the server.** It is set as a platform secret
  (`wrangler secret`, Docker env, Render secret) — never in the repo, never in
  the frontend build.
- **Set `VITE_USERSIG_MODE=server`** for the production frontend build, and
  leave `VITE_SDK_SECRET_KEY` blank. (The web Docker image deliberately has no
  build-arg for the secret key, so this mistake is impossible.)

---

## 1. Cloudflare Workers — the recommended managed path

The Vue SPA and UserSig API deploy together as **one Worker + static assets**
on a single `*.workers.dev` URL (or your custom domain). No nginx, no second
service, no CORS.

### One-time setup

1. Create a [Cloudflare account](https://dash.cloudflare.com/sign-up) and
   install Wrangler locally (included in `web/` devDependencies after
   `npm install`).
2. Log in: `npx wrangler login`
3. Copy secrets template:
   ```bash
   cp web/.dev.vars.example web/.dev.vars
   # fill SDK_APP_ID and SDK_SECRET_KEY
   ```
4. Set production secrets (never commit these):
   ```bash
   cd web
   npx wrangler secret put SDK_SECRET_KEY
   ```
   Set `SDK_APP_ID` in the Cloudflare dashboard under Workers → your worker →
   Settings → Variables, or add it to `wrangler.jsonc` under `vars` (the App ID
   is not as sensitive as the secret key).

### Deploy

From the repo root:

```bash
cd web
npm install
VITE_SDK_APP_ID=<your-app-id> \
VITE_USERSIG_MODE=server \
npm run deploy
```

Or from the root: `npm run deploy:cloudflare` (set `VITE_SDK_APP_ID` in your
shell first).

Wrangler prints your live URL, e.g. `https://kwitch.<account>.workers.dev`.

### How it works

```
Browser ── HTTPS ──▶ Cloudflare Workers (single origin)
                      ├─ /usersig, /healthz  → Worker script (signs UserSigs)
                      └─ /*                    → static assets + SPA fallback
```

- `web/wrangler.jsonc` — Worker config with `run_worker_first` so API routes
  hit the Worker; everything else serves the Vue bundle.
- `web/worker/index.ts` — POST `/usersig`, GET `/healthz` / `/readyz`.
- `@cloudflare/vite-plugin` — local dev runs the Worker + Vite together;
  `npm run deploy` builds and publishes both.

### Local dev with Cloudflare

```bash
cp web/.dev.vars.example web/.dev.vars   # SDK_APP_ID + SDK_SECRET_KEY
cp .env.example web/.env.local           # VITE_SDK_APP_ID, VITE_USERSIG_MODE=server
cd web && npm run dev
```

The Worker signs `/usersig` using `.dev.vars`. Alternatively, run the Express
server (`npm run dev:server` at the repo root) and keep using the Vite proxy —
but do not use both at once for `/usersig`.

### Custom domain

In the Cloudflare dashboard: Workers → kwitch → Settings → Domains & Routes →
Add Custom Domain.

---

## 2. Docker Compose — self-hosted path

Runs unchanged on any Docker host: a $5 VPS, EC2, Compute Engine, a homelab
box, or your laptop.

```bash
cp .env.example .env        # fill in SDK_APP_ID and SDK_SECRET_KEY
docker compose up --build
# open http://localhost:8080
```

What you get:

- `web` — the Vite bundle built in **server mode**, served by hardened,
  unprivileged nginx (SPA fallback, gzip, immutable asset caching, security
  headers, `/healthz`) on port `8080`. nginx also **reverse-proxies
  `/usersig`** to the internal API, so the whole app lives on one origin.
- `usersig` — the signing API, **not published publicly** (only reachable
  from the web container), non-root, with a Docker `HEALTHCHECK`, helmet,
  rate limiting, structured logs, and graceful shutdown.

To go to production on a VM:

1. Copy the repo (or just `docker-compose.yml` + prebuilt images) to the box.
2. Set `.env` with your real credentials and, if you serve on a domain,
   `CORS_ORIGIN=https://your-domain.example`.
3. Put HTTPS in front of port 8080 — e.g. a 10-line Caddyfile:

   ```
   your-domain.example {
       reverse_proxy localhost:8080
   }
   ```

That's the entire deployment. One box, one vendor (or zero, if the box is
yours).

---

## 3. Render Blueprint — optional managed path

If you'd rather use Render instead of Cloudflare, `render.yaml` deploys both
pieces to a single managed vendor in one click:

1. Push the repo to GitHub → Render Dashboard → **New → Blueprint** → pick the
   repo.
2. Fill in the prompted secrets (`SDK_APP_ID`, `SDK_SECRET_KEY`,
   `VITE_SDK_APP_ID`).
3. After the first deploy, cross-wire the URLs (Render assigns them on first
   deploy): set `VITE_USERSIG_SERVER_URL` on **kwitch-web** to the
   **kwitch-usersig** URL, and `CORS_ORIGIN` on **kwitch-usersig** to the
   **kwitch-web** URL. Redeploy.
4. Verify: `curl https://<usersig-url>/healthz` → `{"ok":true,…}`.

> Render hosts the frontend and API on two subdomains, so this path — unlike
> Docker or Cloudflare — does need the one-time URL/CORS cross-wiring and sets
> `VITE_USERSIG_SERVER_URL` to a full URL.

---

## 4. Configuration reference

### UserSig server (Node / Docker / Render)

| Env var | Default | Purpose |
|---|---|---|
| `SDK_APP_ID` | — (required) | Your TRTC SDKAppID |
| `SDK_SECRET_KEY` | — (required) | Your TRTC SDKSecretKey (**secret**) |
| `PORT` | `3001` | Listen port |
| `CORS_ORIGIN` | `http://localhost:5173` | Comma-separated allowed frontend origins |
| `USERSIG_EXPIRE_SECONDS` | `3600` | Sig TTL |
| `RATE_LIMIT_PER_MINUTE` | `60` | `/usersig` requests per IP per minute |
| `TRUST_PROXY` | `false` | Set `true` behind a reverse proxy (compose sets it) |
| `LOG_LEVEL` | `info` | pino log level |
| `NODE_ENV` | `development` | `production` switches to JSON logs |

Probes: `GET /healthz` (liveness, `/health` kept as an alias) and
`GET /readyz` (readiness).

### Cloudflare Worker secrets / vars

| Name | Kind | Purpose |
|---|---|---|
| `SDK_APP_ID` | var | Your TRTC SDKAppID |
| `SDK_SECRET_KEY` | secret | Your TRTC SDKSecretKey |
| `USERSIG_EXPIRE_SECONDS` | var (optional) | Sig TTL, default `3600` |
| `RATE_LIMIT_PER_MINUTE` | var (optional) | Abuse protection, default `60` |

Local dev: copy `web/.dev.vars.example` → `web/.dev.vars`.

### Frontend build

The build reads `VITE_*` from real environment variables **or**
`web/.env.local` (env vars win), so CI/cloud builds need no `.env` file:

| Env var | Production value |
|---|---|
| `VITE_SDK_APP_ID` | your SDKAppID |
| `VITE_USERSIG_MODE` | `server` |
| `VITE_USERSIG_SERVER_URL` | **empty** (same-origin, default) — set a full URL only for split deployments like Render |
| `VITE_SDK_SECRET_KEY` | *(leave empty)* |

### Web container (Docker only)

| Env var | Default | Purpose |
|---|---|---|
| `USERSIG_UPSTREAM` | `http://127.0.0.1:3001/usersig` | Where nginx forwards `/usersig` (compose sets `http://usersig:3001/usersig`) |

### Local development

`npm run dev` (Vite + Cloudflare plugin) signs `/usersig` via the Worker when
`web/.dev.vars` is present. With the Express server instead
(`npm run dev:server`), Vite proxies `/usersig` to `http://localhost:3001`.

### WebRTC / secure-context notes

- Camera/mic require HTTPS in production (see golden rules above).
- TRTC uses WebRTC for media; the SDK negotiates UDP/TCP and falls back through
  Tencent's TURN relays, so you generally don't open custom ports. On locked-down
  corporate networks, ensure outbound UDP and `443` are permitted.

---

## 5. Production hardening checklist

Already done in this repo:

- [x] **Single public origin** — UserSig API on same host (Worker, nginx, or
      Render cross-wired once).
- [x] **Rate limiting** on `/usersig` (configurable via `RATE_LIMIT_PER_MINUTE`).
- [x] **Input validation** — `userId` restricted to a safe charset and length;
      request bodies capped at 4 KB.
- [x] **Security headers** — helmet on the Node API; nginx headers on Docker;
      Cloudflare adds TLS and edge protections by default.
- [x] **Structured JSON logging** (pino on Node) with health-probe noise filtered out.
- [x] **Graceful shutdown** on SIGTERM/SIGINT for clean rolling deploys.
- [x] **Liveness/readiness probes** on all paths.
- [x] **Non-root containers** with Docker `HEALTHCHECK`s.
- [x] **No secret in the client bundle** in server mode; secrets never logged.

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
- `npm run dev` — preflight + Vite dev server with Cloudflare Worker (needs `.dev.vars` for server mode).
- `npm run build` — preflight + typecheck + Vite production build → `web/dist/client`.
- `npm run deploy` — build + `wrangler deploy` to Cloudflare.
- `npm run preview` — serve the production build locally to sanity-check it.
- `npm run lint` / `lint:fix` / `typecheck` — what CI runs.

**Server (`server/package.json`):** — used by Docker Compose and optional local dev
- `npm run dev` — `tsx watch` (hot-reload during development, pretty logs).
- `npm run build` — `tsc` → `server/dist`.
- `npm start` — run the compiled server (`node dist/index.js`).
- `npm test` — vitest + supertest integration tests.

**Root (`package.json`):**
- `npm run deploy:cloudflare` — delegates to `web` deploy script.
