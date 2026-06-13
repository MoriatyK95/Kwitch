/**
 * LiveKit API server — issues access tokens and lists active rooms.
 *
 *   client  --POST /token { identity, name, roomName, role }-->  server
 *   server  -- JWT signed with LIVEKIT_API_SECRET (held only here)
 *   client  -- room.connect(livekitUrl, token)
 */
import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import type { Logger } from 'pino';
import type { ServerConfig } from './config.js';
import { listStreams, mintAccessToken, updateStreamMetadata, type ParticipantRole } from './livekit.js';
import {
  evaluateChatMessage,
  followChannel,
  getAccount,
  getAnalytics,
  getChannel,
  getModeration,
  getReadiness,
  getStreamKey,
  listFollowers,
  listModerationEvents,
  platformManifest,
  resolveModerationEvent,
  rotateStreamKey,
  updateAccount,
  updateChannel,
  updateModeration,
} from './platform.js';

const IDENTITY_PATTERN = /^[A-Za-z0-9_\-.@]{1,64}$/;
const ROOM_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const ROLES = new Set<ParticipantRole>(['host', 'viewer', 'guest']);

export function createApp(config: ServerConfig, logger: Logger): Express {
  const app = express();

  if (config.trustProxy) {
    app.set('trust proxy', 1);
  }
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(express.json({ limit: '4kb' }));
  app.use(cors({ origin: config.corsOrigins }));
  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req) =>
          req.url === '/health' || req.url === '/healthz' || req.url === '/readyz',
      },
    }),
  );

  const limiter = rateLimit({
    windowMs: 60_000,
    max: config.rateLimitPerMinute,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/token', limiter);

  const health = (_req: express.Request, res: express.Response) => {
    res.json({ ok: true, uptime: process.uptime() });
  };
  app.get('/health', health);
  app.get('/healthz', health);
  app.get('/readyz', (_req, res) => {
    res.json({ ready: true });
  });

  /**
   * POST /token
   * Body: { identity, name, roomName, role }
   * Returns: { token, url }
   */
  app.post('/token', async (req, res) => {
    const { identity, name, roomName, role } = req.body ?? {};

    if (!identity || typeof identity !== 'string') {
      return res.status(400).json({ error: 'identity (string) is required' });
    }
    if (!IDENTITY_PATTERN.test(identity)) {
      return res.status(400).json({
        error: 'identity must be 1-64 chars of letters, digits, "_", "-", ".", "@"',
      });
    }
    if (!roomName || typeof roomName !== 'string') {
      return res.status(400).json({ error: 'roomName (string) is required' });
    }
    if (!ROOM_PATTERN.test(roomName)) {
      return res.status(400).json({
        error: 'roomName must be 1-128 chars of letters, digits, "_", "-"',
      });
    }
    if (!role || typeof role !== 'string' || !ROLES.has(role as ParticipantRole)) {
      return res.status(400).json({ error: 'role must be "host", "viewer", or "guest"' });
    }

    try {
      const result = await mintAccessToken(config, {
        identity,
        name: typeof name === 'string' && name.trim() ? name.trim() : identity,
        roomName,
        role: role as ParticipantRole,
      });
      return res.json(result);
    } catch (err) {
      logger.error({ err }, 'token minting failed');
      return res.status(500).json({ error: 'failed to generate token' });
    }
  });

  /** GET /streams — active LiveKit rooms (live discovery). */
  app.get('/streams', async (_req, res) => {
    try {
      const streams = await listStreams(config);
      return res.json({ streams });
    } catch (err) {
      logger.error({ err }, 'list streams failed');
      return res.status(502).json({ error: 'failed to list streams' });
    }
  });

  /** POST /room-metadata — set stream title/host info for browse discovery. */
  app.post('/room-metadata', async (req, res) => {
    const { roomName, title, hostId, hostName } = req.body ?? {};
    if (!roomName || typeof roomName !== 'string') {
      return res.status(400).json({ error: 'roomName (string) is required' });
    }
    if (!ROOM_PATTERN.test(roomName)) {
      return res.status(400).json({ error: 'invalid roomName' });
    }
    try {
      await updateStreamMetadata(config, roomName, {
        title: typeof title === 'string' ? title : roomName,
        hostId: typeof hostId === 'string' ? hostId : '',
        hostName: typeof hostName === 'string' ? hostName : '',
      });
      return res.json({ ok: true });
    } catch (err) {
      logger.error({ err }, 'update room metadata failed');
      return res.status(500).json({ error: 'failed to update metadata' });
    }
  });

  app.get('/platform/manifest', (_req, res) => {
    res.json(platformManifest());
  });

  app.get('/platform/readiness', (_req, res) => {
    res.json({ items: getReadiness() });
  });

  app.get('/accounts/:userId', (req, res) => {
    res.json({ account: getAccount(req.params.userId) });
  });

  app.put('/accounts/:userId', (req, res) => {
    const { displayName, emailVerified, roles } = req.body ?? {};
    const account = updateAccount(req.params.userId, {
      ...(typeof displayName === 'string' ? { displayName } : {}),
      ...(typeof emailVerified === 'boolean' ? { emailVerified } : {}),
      ...(Array.isArray(roles) ? { roles } : {}),
    });
    res.json({ account });
  });

  app.get('/channels/:channelId', (req, res) => {
    res.json({ channel: getChannel(req.params.channelId) });
  });

  app.put('/channels/:channelId', (req, res) => {
    const { displayName, category, tags, title, bio, mature } = req.body ?? {};
    const channel = updateChannel(req.params.channelId, {
      ...(typeof displayName === 'string' ? { displayName } : {}),
      ...(typeof category === 'string' ? { category } : {}),
      ...(Array.isArray(tags) ? { tags: tags.filter((t): t is string => typeof t === 'string') } : {}),
      ...(typeof title === 'string' ? { title } : {}),
      ...(typeof bio === 'string' ? { bio } : {}),
      ...(typeof mature === 'boolean' ? { mature } : {}),
    });
    res.json({ channel });
  });

  app.get('/channels/:channelId/moderation', (req, res) => {
    res.json({ moderation: getModeration(req.params.channelId) });
  });

  app.put('/channels/:channelId/moderation', (req, res) => {
    const { bannedWords, slowModeSeconds, followersOnly, subscribersOnly, linksAllowed } =
      req.body ?? {};
    const settings = updateModeration(req.params.channelId, {
      ...(Array.isArray(bannedWords)
        ? { bannedWords: bannedWords.filter((w): w is string => typeof w === 'string') }
        : {}),
      ...(typeof slowModeSeconds === 'number' ? { slowModeSeconds } : {}),
      ...(typeof followersOnly === 'boolean' ? { followersOnly } : {}),
      ...(typeof subscribersOnly === 'boolean' ? { subscribersOnly } : {}),
      ...(typeof linksAllowed === 'boolean' ? { linksAllowed } : {}),
    });
    res.json({ moderation: settings });
  });

  app.get('/channels/:channelId/analytics', (req, res) => {
    res.json({ analytics: getAnalytics(req.params.channelId) });
  });

  app.get('/channels/:channelId/stream-key', (req, res) => {
    res.json({ streamKey: getStreamKey(req.params.channelId) });
  });

  app.post('/channels/:channelId/stream-key/rotate', (req, res) => {
    res.json({ streamKey: rotateStreamKey(req.params.channelId) });
  });

  app.post('/channels/:channelId/follow', (req, res) => {
    const { followerId, notifications } = req.body ?? {};
    if (!followerId || typeof followerId !== 'string') {
      return res.status(400).json({ error: 'followerId (string) is required' });
    }
    res.json({
      follow: followChannel(
        req.params.channelId,
        followerId,
        typeof notifications === 'boolean' ? notifications : true,
      ),
    });
  });

  app.get('/channels/:channelId/followers', (req, res) => {
    res.json({ followers: listFollowers(req.params.channelId) });
  });

  app.post('/channels/:channelId/moderation/evaluate', (req, res) => {
    const { actorId, message } = req.body ?? {};
    if (!actorId || typeof actorId !== 'string') {
      return res.status(400).json({ error: 'actorId (string) is required' });
    }
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message (string) is required' });
    }
    res.json(evaluateChatMessage(req.params.channelId, actorId, message));
  });

  app.get('/admin/safety/queue', (req, res) => {
    const channelId = typeof req.query.channelId === 'string' ? req.query.channelId : undefined;
    res.json({ queue: listModerationEvents(channelId) });
  });

  app.post('/admin/safety/queue/:eventId/resolve', (req, res) => {
    const event = resolveModerationEvent(req.params.eventId);
    if (!event) return res.status(404).json({ error: 'event not found' });
    res.json({ event });
  });

  app.use((_req, res) => {
    res.status(404).json({ error: 'not found' });
  });

  app.use(
    (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      if (res.headersSent) return;
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
