# 🎥 TRTC Live — a Twitch/Kick-style clone, built to learn from

A **public, open-source reference repository** that teaches you how to build a
live-streaming platform in the style of Twitch / Kick on top of the
[Tencent RTC (TRTC) Web Core SDK — "AtomicXCore"](https://trtc.io/document/74840).

This is a **learning product**, not a polished app. Every file, comment, and
commit is optimized so that a developer who has *never touched TRTC* can go from
`git clone` to *"I understand how live streaming works and I can run it with my
own credentials"* in under an hour.

By the end you will understand two things clearly:

1. **How to run it locally** with your own TRTC credentials (the fast, dev-only path).
2. **What a production version looks like** and how to deploy it (the secure, server-signed path).

---

## ⚡ 5-minute local quickstart

> Prerequisites: Node ≥ 20.19 (an `.nvmrc` is included — run `nvm use`), and a
> modern Chromium/Firefox/Safari browser. Camera/mic only work on a **secure
> context** — `localhost` counts, so local dev works over plain HTTP.

```bash
# 1. Clone and enter the repo
git clone <this-repo-url> trtc-twitch-clone
cd trtc-twitch-clone

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

Open the printed URL (default `http://localhost:5173`), pick a display name, and
hit **Enter**. You're logged into TRTC. Click **Go Live** to broadcast, or open
the same app in a second tab/device and watch from the **Browse** page.

That's it — no backend required for the local path.

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

A minimal but coherent Twitch/Kick experience. Every feature maps to a specific
AtomicXCore capability — see **[docs/FEATURES.md](docs/FEATURES.md)** for the
full table with links.

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

## 📁 Repository layout

```
.
├── README.md                  # you are here
├── .env.example               # documented template for every env var
├── .gitignore                 # ignores .env.local, node_modules, dist, …
├── .nvmrc                      # pins the Node version
├── docs/
│   ├── ARCHITECTURE.md         # how LiveView / StreamMixer / state modules fit
│   ├── LOCAL_VS_PRODUCTION.md  # the two UserSig modes + the security tradeoff
│   ├── DEPLOYMENT.md           # deploy the frontend + the UserSig server
│   └── FEATURES.md             # each feature ↔ the TRTC API that powers it
├── web/                        # Vue 3 + Vite + TS frontend
│   ├── scripts/preflight.mjs   # friendly env check before dev/build
│   └── src/
│       ├── pages/              # BrowsePage, GoLivePage, WatchPage
│       ├── components/         # chat, viewers, gifts, co-guest/host, dev banner
│       └── trtc/               # ★ the single credential/login abstraction
└── server/                     # Node + Express UserSig service (production path)
    └── src/index.ts            # POST /usersig — signs with the secret key
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

MIT — see [LICENSE](LICENSE). This is sample/teaching code; harden it before
using it in production (see the checklist in
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)).
