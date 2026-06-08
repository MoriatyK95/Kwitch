# Deployment

A production deployment has **two pieces**:

1. **Frontend** — the static Vite build (served over HTTPS).
2. **UserSig server** — the small Node service that signs UserSigs with your
   secret key.

You deploy them separately, then point the frontend at the server.

> Everything below runs on **free tiers**. No database, no paid services.

---

## 0. Prerequisites & the golden rules

- **HTTPS is mandatory for the frontend.** Browsers only allow camera/mic
  (`getUserMedia`) on a *secure context*. Any static host below gives you HTTPS
  automatically.
- **The secret key lives only on the server.** It is set as an environment
  variable in your server host's dashboard — never in the repo, never in the
  frontend build.
- **Set `VITE_USERSIG_MODE=server`** for the production frontend build, and
  leave `VITE_SDK_SECRET_KEY` blank.

---

## 1. Deploy the UserSig server

The server is a standard Node + Express app. Deploy it to any Node host. Example
with **Render** (Railway / Fly.io are equivalent):

### Render

1. New → **Web Service** → connect this repo.
2. **Root Directory:** `server`
3. **Build Command:** `npm install && npm run build`
4. **Start Command:** `npm start`
5. **Environment variables** (Dashboard → Environment):
   | Key | Value |
   |---|---|
   | `SDK_APP_ID` | your SDKAppID |
   | `SDK_SECRET_KEY` | your SDKSecretKey (**secret** — only here) |
   | `USERSIG_EXPIRE_SECONDS` | `3600` |
   | `CORS_ORIGIN` | your frontend URL, e.g. `https://your-app.vercel.app` |
6. Deploy. Note the public URL, e.g. `https://trtc-usersig.onrender.com`.
7. Verify: `curl https://trtc-usersig.onrender.com/health` → `{"ok":true}`.

### Railway / Fly.io

Same idea: set the root to `server/`, build with `npm install && npm run build`,
start with `npm start`, and set the four env vars in the platform's secret
store. Fly.io needs a `fly.toml` (run `fly launch` in `server/`) and
`fly secrets set SDK_SECRET_KEY=… SDK_APP_ID=…`.

> **CORS:** the server only accepts requests from the origins in `CORS_ORIGIN`
> (comma-separated). If your frontend can't reach `/usersig`, this is almost
> always the cause — make sure the value exactly matches the deployed frontend
> origin (scheme + host, no trailing slash).

---

## 2. Deploy the frontend

The frontend is a static Vite build (`web/dist`). Example with **Vercel**
(Netlify / Cloudflare Pages are equivalent):

### Vercel

1. New Project → import this repo.
2. **Root Directory:** `web`
3. **Framework Preset:** Vite (or "Other").
4. **Build Command:** `npm run build`
5. **Output Directory:** `dist`
6. **Environment variables** (Project Settings → Environment Variables):
   | Key | Value |
   |---|---|
   | `VITE_SDK_APP_ID` | your SDKAppID |
   | `VITE_USERSIG_MODE` | `server` |
   | `VITE_USERSIG_SERVER_URL` | the server URL from step 1, e.g. `https://trtc-usersig.onrender.com` |
   | `VITE_SDK_SECRET_KEY` | *(leave empty — not needed in server mode)* |
7. Deploy. Vercel serves it over HTTPS automatically. ✅

### Netlify

- Base directory: `web`
- Build command: `npm run build`
- Publish directory: `web/dist`
- Set the same `VITE_*` env vars under Site settings → Environment.

### Cloudflare Pages

- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `web`
- Set the same `VITE_*` env vars under Settings → Environment variables.

---

## 3. Wire them together

The frontend's `VITE_USERSIG_SERVER_URL` must point at the deployed server, and
the server's `CORS_ORIGIN` must include the deployed frontend origin. Both are
set in their respective platform dashboards — not in the repo.

```
Frontend (Vercel, HTTPS)
   VITE_USERSIG_MODE=server
   VITE_USERSIG_SERVER_URL=https://trtc-usersig.onrender.com
            │  POST /usersig { userId }
            ▼
UserSig server (Render, HTTPS)
   SDK_SECRET_KEY=••••  (server-only)
   CORS_ORIGIN=https://your-app.vercel.app
```

### WebRTC / secure-context notes

- Camera/mic require HTTPS — guaranteed by all hosts above.
- TRTC uses WebRTC for media; the SDK negotiates UDP/TCP and falls back through
  Tencent's TURN relays, so you generally don't open custom ports. On locked-down
  corporate networks, ensure outbound UDP and `443` are permitted.

---

## 4. Production hardening checklist

Before you call it production:

- [ ] **`VITE_USERSIG_MODE=server`** in the deployed frontend (no client signing).
- [ ] **`VITE_SDK_SECRET_KEY` is empty** in the frontend build — confirm the
      secret is not in the shipped JS (search the bundle for it).
- [ ] **Short sig TTL** — keep `USERSIG_EXPIRE_SECONDS` modest (e.g. 3600).
- [ ] **Authenticate the sig endpoint** — require the caller's own session/JWT
      and derive `userId` from it; don't trust a client-supplied `userId`.
- [ ] **Rate-limit `/usersig`** — already on (60/min/IP via `express-rate-limit`);
      tune for your traffic and consider per-user limits.
- [ ] **Rotate keys** — if a secret key is ever exposed, rotate it in the TRTC
      Console immediately.
- [ ] **Don't log secrets** — the server never logs the key or raw sig; keep it
      that way.
- [ ] **CORS locked down** — `CORS_ORIGIN` lists only your real frontend
      origin(s), not `*`.

---

## 5. The deploy/build scripts

The documented commands map to real npm scripts:

**Frontend (`web/package.json`):**
- `npm run dev` — preflight check + Vite dev server.
- `npm run build` — typecheck + Vite production build → `web/dist`.
- `npm run preview` — serve the production build locally to sanity-check it.

**Server (`server/package.json`):**
- `npm run dev` — `tsx watch` (hot-reload during development).
- `npm run build` — `tsc` → `server/dist`.
- `npm start` — run the compiled server (`node dist/index.js`).
