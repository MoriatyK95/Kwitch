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
 * The app is exported as a factory so it can be exercised by integration
 * tests (supertest) without binding a real port.
 */
import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import type { Logger } from 'pino';
import TLSSigAPIv2 from 'tls-sig-api-v2';
import type { ServerConfig } from './config.js';

/**
 * userId constraints: TRTC allows up to 32 bytes; we accept a conservative,
 * URL-safe charset so a hostile client can't smuggle odd payloads into logs
 * or downstream systems.
 */
const USER_ID_PATTERN = /^[A-Za-z0-9_\-.@]{1,64}$/;

export function createApp(config: ServerConfig, logger: Logger): Express {
  // One signer instance, reused across requests. The secret never leaves it.
  const api = new TLSSigAPIv2.Api(config.sdkAppId, config.sdkSecretKey);

  const app = express();

  // Behind a load balancer / reverse proxy (Render, Fly, nginx, ALB…) the
  // client IP arrives in X-Forwarded-For; rate limiting needs the real IP.
  if (config.trustProxy) {
    app.set('trust proxy', 1);
  }
  app.disable('x-powered-by');

  app.use(helmet());
  // This service only ever receives a tiny JSON body — reject anything big.
  app.use(express.json({ limit: '4kb' }));
  app.use(cors({ origin: config.corsOrigins }));
  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        // Health probes fire every few seconds — keep them out of the logs.
        ignore: (req) => req.url === '/health' || req.url === '/healthz' || req.url === '/readyz',
      },
    }),
  );

  const limiter = rateLimit({
    windowMs: 60_000,
    max: config.rateLimitPerMinute,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/usersig', limiter);

  /** Liveness probes. `/health` kept for backwards compatibility. */
  const health = (_req: express.Request, res: express.Response) => {
    res.json({ ok: true, uptime: process.uptime() });
  };
  app.get('/health', health);
  app.get('/healthz', health);

  /** Readiness probe — config is validated at startup, so ready == alive. */
  app.get('/readyz', (_req, res) => {
    res.json({ ready: true });
  });

  /**
   * POST /usersig
   * Body: { userId: string }
   * Returns: { userSig: string, expire: number }
   *
   * ⚠️ The demo trusts the userId in the body. In a real product you MUST
   * first authenticate the caller (verify a session/JWT) and derive userId
   * from that — otherwise anyone can request a sig for anyone.
   */
  app.post('/usersig', (req, res) => {
    const { userId } = req.body ?? {};
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId (string) is required' });
    }
    if (!USER_ID_PATTERN.test(userId)) {
      return res.status(400).json({
        error: 'userId must be 1-64 chars of letters, digits, "_", "-", ".", "@"',
      });
    }

    try {
      // The one line that needs the secret key — runs only here, on the server.
      const userSig = api.genSig(userId, config.userSigExpireSeconds);
      return res.json({ userSig, expire: config.userSigExpireSeconds });
    } catch (err) {
      // Never log the secret key or the raw sig.
      logger.error({ err }, 'usersig signing failed');
      return res.status(500).json({ error: 'failed to generate userSig' });
    }
  });

  /** JSON 404 for everything else. */
  app.use((_req, res) => {
    res.status(404).json({ error: 'not found' });
  });

  /** Last-resort error handler — never leak stack traces to clients. */
  app.use(
    (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      if (res.headersSent) return;
      // body-parser errors carry an HTTP status (413 payload too large,
      // 400 malformed JSON, …) — surface those instead of a generic 500.
      const maybeStatus = (err as { status?: unknown }).status;
      const status = typeof maybeStatus === 'number' ? maybeStatus : 500;
      if (status >= 500) {
        logger.error({ err }, 'unhandled error');
        res.status(500).json({ error: 'internal server error' });
      } else {
        res.status(status).json({ error: err.message || 'bad request' });
      }
    },
  );

  return app;
}
