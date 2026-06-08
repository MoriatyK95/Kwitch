/**
 * TRTC UserSig server — the SECURE, production path.
 * ===========================================================================
 * Why this exists
 * ---------------
 * A UserSig is an HMAC-SHA256 signature over (SDKAppID + userId + time +
 * expire), keyed by your SDKSecretKey. Whoever can compute it can impersonate
 * any user in your TRTC app. Therefore the secret key must live ONLY on a
 * server you control — never in the browser bundle (that's what the frontend's
 * dev-only "local" mode does, and why it's unsafe for production).
 *
 * The handshake this server completes:
 *   client  --POST /usersig { userId }-->  server
 *   server  -- genSig(userId, expire) with secret key (held only here)
 *   server  --{ userSig }-->  client
 *   client  -- SDK.login({ sdkAppId, userId, userSig })
 *   Tencent -- verifies the sig against your SDKAppID. ✅
 *
 * Production hardening notes are inline and in docs/DEPLOYMENT.md.
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import TLSSigAPIv2 from 'tls-sig-api-v2';

// --- Configuration (from env; NEVER hardcode secrets) ----------------------
const SDK_APP_ID = Number(process.env.SDK_APP_ID ?? 0);
const SDK_SECRET_KEY = process.env.SDK_SECRET_KEY ?? '';
const PORT = Number(process.env.PORT ?? 3001);
const USERSIG_EXPIRE_SECONDS = Number(process.env.USERSIG_EXPIRE_SECONDS ?? 3600);
const CORS_ORIGIN = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

// Fail fast with a clear message if credentials are missing.
if (!SDK_APP_ID || !SDK_SECRET_KEY) {
  console.error(
    '\n✖ Missing SDK_APP_ID or SDK_SECRET_KEY. Copy .env.example to server/.env ' +
      'and fill them in (get them from https://console.trtc.io/app).\n',
  );
  process.exit(1);
}

// One signer instance, reused across requests. The secret key never leaves it.
const api = new TLSSigAPIv2.Api(SDK_APP_ID, SDK_SECRET_KEY);

const app = express();
app.use(express.json());

// Only allow the configured frontend origin(s) to call us.
app.use(cors({ origin: CORS_ORIGIN }));

// Basic abuse protection: cap how often the sig endpoint can be hit. In a real
// app you'd also require the caller's own auth token before issuing a sig.
const limiter = rateLimit({ windowMs: 60_000, max: 60 });
app.use('/usersig', limiter);

/** Health check. */
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

/**
 * POST /usersig
 * Body: { userId: string }
 * Returns: { userSig: string, expire: number }
 *
 * ⚠️ The demo trusts the userId in the body. In production you MUST first
 * authenticate the caller (e.g. verify a session/JWT) and derive userId from
 * that — otherwise anyone can request a sig for anyone.
 */
app.post('/usersig', (req, res) => {
  const { userId } = req.body ?? {};
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId (string) is required' });
  }

  try {
    // The one line that needs the secret key — runs only here, on the server.
    const userSig = api.genSig(userId, USERSIG_EXPIRE_SECONDS);
    return res.json({ userSig, expire: USERSIG_EXPIRE_SECONDS });
  } catch (err) {
    // Never log the secret key or the raw sig in production logs.
    console.error('[usersig] signing failed:', err instanceof Error ? err.message : err);
    return res.status(500).json({ error: 'failed to generate userSig' });
  }
});

app.listen(PORT, () => {
  console.log(`UserSig server listening on http://localhost:${PORT}`);
  console.log(`  SDKAppID: ${SDK_APP_ID}`);
  console.log(`  Allowed origins: ${CORS_ORIGIN.join(', ')}`);
  console.log(`  Sig TTL: ${USERSIG_EXPIRE_SECONDS}s`);
});
