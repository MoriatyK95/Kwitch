# 🎥 Kwitch — an open-source live-streaming platform

**Kwitch** is a Twitch/Kick-style live-streaming platform built on the
[Tencent RTC (TRTC) Web Core SDK — "AtomicXCore"](https://trtc.io/document/74840),
with its own visual identity (the "Aurora" design system — electric cyan →
violet on deep midnight blue) and everything you need to run it in the cloud:
Dockerfiles, Docker Compose, CI, health probes, hardened services, and
one-click platform configs.

It is still optimized for learning — every file and comment teaches you how a
live-streaming product works — but the operational pieces are real:

- **Frontend**: Vue 3 + Vite + TypeScript, served by hardened nginx (SPA
  fallback, immutable asset caching, security headers) or any static host.
- **UserSig server**: Node + Express with helmet, input validation, rate
  limiting, structured pino logs, liveness/readiness probes, graceful
  shutdown, and integration tests.
- **Cloud-ready, without vendor sprawl**: one vendor-neutral Docker Compose
  stack that runs on any host behind a single public origin (nginx serves the
  app and proxies the UserSig API — no CORS, no second hostname), plus one
  optional managed alternative (`render.yaml`) and a GitHub Actions CI
  pipeline.

---

## ⚡ 5-minute local quickstart

> Prerequisites: Node ≥ 20.19 (an `.nvmrc` is included — run `nvm use`), and a
> modern Chromium/Firefox/Safari browser. Camera/mic only work on a **secure
> context** — `localhost` counts, so local dev works over plain HTTP.

```bash
# 1. Clone and enter the repo
git clone <this-repo-url> kwitch
cd kwitch

# 2. Configure the frontend with your TRTC credentials (see next section)
cp .env.example web/.env.local
#   then edit web/.env.local and set:
#     VITE_SDK_APP_ID=<your SDKAppID>
#     VITE_SDK_SECRET_KEY=<your SDKSecretKey>   # dev-only!
#     VITE_USERSIG_MODE=local

# 3. Install and run the frontend
cd web
npm install
npm run dev        # a preflight check verifies your env, then Vite starts
```

Open the printed URL (default `http://localhost:5173`), pick a display name,
and hit **Start watching**. You're logged into TRTC. Click **Go Live** to
broadcast, or open the same app in a second tab/device and watch from the
**Browse** page.

That's it — no backend required for the local path.

## 🐳 Production-like stack in one command

```bash
cp .env.example .env       # fill in SDK_APP_ID and SDK_SECRET_KEY
docker compose up --build
# open http://localhost:8080
```

This builds the frontend in the **secure, server-signed mode** and serves
everything from a single origin — nginx hosts the app and reverse-proxies
`/usersig` to the internal API, so there's no CORS setup and the signing
service is never exposed publicly. The same stack runs unchanged on any
Docker host (VPS, EC2, Compute Engine). See
**[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**, which also covers the one
optional managed-hosting alternative (Render).

---

## 🔑 Get your TRTC credentials

You need a TRTC application's **SDKAppID** and **SDKSecretKey**.

1. Go to the **[TRTC Console → Applications](https://console.trtc.io/app)** and
   create an application (or open an existing one).
2. Open **Application Management**. Copy the **SDKAppID** (a number) and the
   **SDKSecretKey** (a long hex string).
3. Paste them into `web/.env.local`:
   - `VITE_SDK_APP_ID=` ← your SDKAppID
   - `VITE_SDK_SECRET_KEY=` ← your SDKSecretKey *(local/dev mode only)*
4. (Optional, no-code sanity check) The
   **[Console UserSig generation tool](https://console.trtc.io/usersig)** can
   mint a one-off UserSig for a userId so you can verify your app is set up
   before writing any code.

> 🔒 **Never commit real credentials.** `.gitignore` ignores all `.env*` files
> except `.env.example`. Your real keys live in `web/.env.local` and
> `server/.env`, which are never tracked.

---

## 🔀 The two operating modes (the core lesson)

The single most important concept in this repo is **how the app obtains a
`UserSig`** — the credential the SDK logs in with. There are two modes, and the
whole codebase is built so the difference lives in **exactly one file**:
[`web/src/trtc/userSig.ts`](web/src/trtc/userSig.ts).

| | **Mode A — `local`** | **Mode B — `server`** |
|---|---|---|
| Where the UserSig is signed | In the browser | On your Node server |
| Where the SDKSecretKey lives | In the client bundle 😱 | Only on the server ✅ |
| Setup effort | Zero backend | Run the `server/` service |
| Use for | First run, local dev | **Production** |
| Flag | `VITE_USERSIG_MODE=local` | `VITE_USERSIG_MODE=server` |

**Mode A is insecure** because the secret key ships to every visitor's browser —
anyone can read it and impersonate any user. It exists only to get you running
fast. A loud banner appears in the UI whenever it's active.

Switching modes is a one-line change in `web/.env.local`. Full explanation and
the security reasoning: **[docs/LOCAL_VS_PRODUCTION.md](docs/LOCAL_VS_PRODUCTION.md)**.

---

## ✨ Features (and the TRTC API behind each)

A minimal but coherent live-streaming experience. Every feature maps to a
specific AtomicXCore capability — see **[docs/FEATURES.md](docs/FEATURES.md)**
for the full table with links.

- **Browse / discovery** — grid of live channels (`useLiveListState.fetchLiveList`)
- **Go Live (host)** — device selection, title, start/stop (`StreamMixer`, `startLive`/`endLive`, `useDeviceState`)
- **Watch (viewer)** — join a channel, graceful "stream ended"/"removed" handling (`LiveView`, `joinLive`/`leaveLive`, `LiveListEvent`)
- **Live chat / barrage** — real-time messages (`useBarrageState`)
- **Viewer count + list** — live audience presence (`useLiveAudienceState`)
- **Likes + gifts** — lightweight engagement (`useLiveGiftState`)
- **Guest star / co-guest** — viewer joins on camera (`useCoGuestState`)
- **Host PK / raid** — two hosts co-stream across rooms (`useCoHostState`)

Scope: **v1 is Web only.** The structure leaves room for a future native
iOS/Android Core SDK track without implementing it now.

---

## 🛡️ What "production ready" means here

| Concern | What's in place |
|---|---|
| Vendor surface | One Docker stack, one public origin; the only hard dependency is TRTC itself |
| Secrets | Server-signed UserSigs; web Docker image *cannot* embed the secret key |
| Network exposure | UserSig API is internal-only behind the nginx proxy — no CORS surface |
| API hardening | helmet, strict `userId` validation, 4 KB body cap, rate limiting, JSON 404/500 |
| Observability | Structured pino logs (JSON in prod), `/healthz` + `/readyz` probes |
| Lifecycle | Graceful SIGTERM/SIGINT shutdown with a 10s drain timeout |
| Containers | Multi-stage, non-root images with `HEALTHCHECK`s; unprivileged nginx |
| Frontend serving | SPA fallback, gzip, immutable asset caching, security headers |
| CI | Lint + typecheck + tests + web build + Docker builds on every push/PR |
| Tests | Server integration tests (vitest + supertest) covering auth, validation, limits, CORS |
| CI-friendly builds | Preflight reads `VITE_*` from real env vars — no `.env.local` needed in CI |

What's intentionally **not** included (your product decisions): user accounts /
sessions (the sig endpoint currently trusts the client-supplied `userId` — wire
it to your auth before launch), a database, and payments. The hardening
checklist in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) covers these.

---

## 📁 Repository layout

```
.
├── README.md                   # you are here
├── .env.example                # documented template for every env var
├── .nvmrc                      # pins the Node version
├── docker-compose.yml          # the deploy unit: web (nginx) + internal usersig API
├── render.yaml                 # OPTIONAL one-vendor managed alternative (Render)
├── .github/workflows/ci.yml    # lint + typecheck + test + build + docker
├── docs/
│   ├── ARCHITECTURE.md         # how LiveView / StreamMixer / state modules fit
│   ├── LOCAL_VS_PRODUCTION.md  # the two UserSig modes + the security tradeoff
│   ├── DEPLOYMENT.md           # the two deploy paths + hardening checklist
│   └── FEATURES.md             # each feature ↔ the TRTC API that powers it
├── web/                        # Vue 3 + Vite + TS frontend
│   ├── Dockerfile              # multi-stage build → unprivileged nginx
│   ├── nginx.conf.template     # SPA fallback, caching, headers, /usersig proxy
│   ├── scripts/preflight.mjs   # env check (reads env vars OR .env.local)
│   └── src/
│       ├── pages/              # Browse, GoLive, Watch, PkBattle, NotFound
│       ├── components/         # chat, viewers, gifts, co-guest/host, shell
│       ├── styles.css          # the Kwitch "Aurora" design system tokens
│       └── trtc/               # ★ the single credential/login abstraction
└── server/                     # Node + Express UserSig service (production path)
    ├── Dockerfile              # multi-stage, non-root, HEALTHCHECK
    └── src/
        ├── config.ts           # validated env config
        ├── app.ts              # hardened express app (factory, testable)
        ├── app.test.ts         # vitest + supertest integration tests
        └── index.ts            # bootstrap + graceful shutdown
```

---

## 📚 What to read next

- New to the moving parts? → **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**
- Want to understand the security model? → **[docs/LOCAL_VS_PRODUCTION.md](docs/LOCAL_VS_PRODUCTION.md)**
- Ready to ship it? → **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**
- Curious which API does what? → **[docs/FEATURES.md](docs/FEATURES.md)**

---

## 🌐 Browser support & HTTPS requirement

- Works in modern **Chrome / Edge / Firefox / Safari**.
- Accessing the camera and microphone requires a **secure context**. `localhost`
  is treated as secure, so local dev works over `http://localhost`. **In
  production you MUST serve the frontend over HTTPS** or the browser will block
  `getUserMedia` and you'll get no camera. See
  [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## 🧭 A note on SDK accuracy

This repo was written against **`tuikit-atomicx-vue3@6.0.0`** and
**`tls-sig-api-v2@1.0.2`**, with API names verified directly from the published
package type definitions. Two naming clarifications worth knowing:

1. The server signing library is published on npm as **`tls-sig-api-v2`** (not
   `tls-sig-api-v2-node`, which is the *GitHub repo* name). We use the npm name.
2. AtomicXCore does not export a ready-made `genTestUserSig`. The dev-mode
   client signer in
   [`web/src/trtc/genTestUserSig.ts`](web/src/trtc/genTestUserSig.ts) is a
   faithful, browser-side port of Tencent's official UserSig algorithm
   (HMAC-SHA256 + zlib), and produces signatures byte-identical to the official
   server library.

If a future SDK version changes a signature, follow the SDK and update the
inline comments — they're meant to stay honest.

## 📄 License

MIT — see [LICENSE](LICENSE). Before going live, work through the hardening
checklist in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — in particular, wire the
UserSig endpoint to your own authentication.
