# Local vs. Production: the two UserSig modes

This is the most important security concept in the repo. Read it once and the
whole credential design will make sense.

## What a UserSig is

To log into TRTC, the SDK needs three things: your `SDKAppID`, a `userId`, and a
**`UserSig`**. The UserSig is a signed token that proves "this user is allowed
to use this app." It is computed as:

```
UserSig = base64url( zlib_deflate( {
  TLS.identifier: userId,
  TLS.sdkappid:   SDKAppID,
  TLS.time:       now,
  TLS.expire:     ttlSeconds,
  TLS.sig:        HMAC_SHA256(secretKey, "TLS.identifier:…TLS.sdkappid:…TLS.time:…TLS.expire:…")
} ) )
```

The crucial part is `TLS.sig`: an **HMAC-SHA256 keyed by your `SDKSecretKey`**.
Whoever holds the secret key can forge a valid UserSig for *any* userId in your
app — i.e. impersonate anyone. So the entire security of TRTC auth reduces to
one question: **who can see the secret key?**

## Mode A — `local` (client-side signing). DEV ONLY.

```
VITE_USERSIG_MODE=local
```

The browser computes the UserSig itself using
`web/src/trtc/genTestUserSig.ts`, reading `VITE_SDK_SECRET_KEY` from your env.

```
┌─────────── browser ───────────┐
│  SDKSecretKey (in the bundle!) │
│        │                       │
│        ▼                       │
│  genTestUserSig(userId) ──► UserSig ──► SDK.login()
└────────────────────────────────┘
```

### Why this is unsafe

Vite inlines every `VITE_*` variable into the JavaScript it ships. That means
**your `SDKSecretKey` ends up in the client bundle**, readable by anyone who
opens devtools or downloads your JS. With it, an attacker can mint UserSigs for
any user and take over rooms, spam, or rack up your usage bill.

It exists for exactly one reason: **getting the demo running in 5 minutes with
zero backend.** The app shows a loud yellow banner whenever this mode is active
(`web/src/components/DevModeBanner.vue`) so you can never forget.

> ✅ Fine for: local development, your own machine, throwaway demos.
> ❌ Never for: anything deployed, anything public, anything real.

## Mode B — `server` (server-side signing). PRODUCTION.

```
VITE_USERSIG_MODE=server
VITE_USERSIG_SERVER_URL=https://your-usersig-server.example.com
```

The browser never sees the secret key. It asks your backend for a UserSig; the
backend signs with the key it alone holds and returns a short-lived token.

```
┌──── browser ────┐         ┌──────── your server ────────┐
│ getUserSig(uid) │  POST   │  SDKSecretKey (server-only)  │
│   fetch /usersig├────────►│        │                     │
│                 │         │        ▼                     │
│   UserSig  ◄────┤  JSON   │  genSig(uid, ttl) ──► UserSig│
│   SDK.login()   │         └──────────────────────────────┘
└─────────────────┘
```

The full handshake:

1. **Client** calls `POST /usersig` with `{ userId }`.
2. **Server** (`server/src/index.ts`) computes
   `new TLSSigAPIv2.Api(SDKAppID, secretKey).genSig(userId, expire)` — the only
   place the secret key is ever used.
3. **Server** returns `{ userSig, expire }`.
4. **Client** calls `SDK.login({ sdkAppId, userId, userSig })`.
5. **Tencent** verifies the sig against your SDKAppID and lets the user in.

> In a real product, step 1 must also carry the caller's own auth (a session
> cookie or JWT). The server should derive `userId` from that verified identity
> — never blindly trust a `userId` sent by the client. The demo stubs this out
> and says so in the code.

## The one place that changes

Both modes are hidden behind a single function,
`web/src/trtc/userSig.ts`:

```ts
export async function getUserSig(userId: string): Promise<string> {
  if (trtcConfig.userSigMode === 'server') {
    return getUserSigFromServer(userId); // fetch from your backend
  }
  return getUserSigLocally(userId);       // sign in the browser (DEV ONLY)
}
```

Everything else in the app — login, going live, watching, chat, gifts — is
**byte-for-byte identical** across modes. That's intentional: the learner can
see that "production-readiness" here is a *one-line config change plus a small
server*, not a rewrite.

## How to switch

1. Deploy the `server/` service (see [DEPLOYMENT.md](DEPLOYMENT.md)).
2. In `web/.env.local`:
   ```diff
   - VITE_USERSIG_MODE=local
   - VITE_SDK_SECRET_KEY=<your-secret>
   + VITE_USERSIG_MODE=server
   + VITE_USERSIG_SERVER_URL=https://your-usersig-server.example.com
   ```
   (Leave `VITE_SDK_SECRET_KEY` blank in server mode — the client doesn't need it.)
3. Rebuild. The dev banner disappears; the secret key is no longer in your bundle.
