/**
 * Kwitch Cloudflare Worker — LiveKit token API + stream discovery.
 */
import { listStreams, mintAccessToken, updateStreamMetadata, type ParticipantRole } from './livekit';
import {
  demoAccount,
  demoAnalytics,
  demoChannel,
  demoFollowers,
  demoModeration,
  demoSafetyQueue,
  demoStreamKey,
  evaluateChatMessage,
  platformManifest,
  readinessItems,
} from './platform';

export interface Env {
  LIVEKIT_URL: string;
  LIVEKIT_API_KEY: string;
  LIVEKIT_API_SECRET: string;
  TOKEN_EXPIRE_SECONDS?: string;
  RATE_LIMIT_PER_MINUTE?: string;
}

const IDENTITY_PATTERN = /^[A-Za-z0-9_\-.@]{1,64}$/;
const ROOM_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const ROLES = new Set<ParticipantRole>(['host', 'viewer', 'guest']);

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

function checkRateLimit(ip: string, max: number): boolean {
  const now = Date.now();
  const windowMs = 60_000;
  const entry = rateLimitStore.get(ip);
  if (!entry || now >= entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/health' || path === '/healthz') {
      return json({ ok: true });
    }
    if (path === '/readyz') {
      return json({ ready: true });
    }

    if (!env.LIVEKIT_URL || !env.LIVEKIT_API_KEY || !env.LIVEKIT_API_SECRET) {
      return json({ error: 'server not configured' }, 503);
    }

    if (path === '/streams' && request.method === 'GET') {
      try {
        const streams = await listStreams(env);
        return json({ streams });
      } catch {
        return json({ error: 'failed to list streams' }, 502);
      }
    }

    if (path === '/platform/manifest' && request.method === 'GET') {
      return json(platformManifest());
    }

    if (path === '/platform/readiness' && request.method === 'GET') {
      return json({ items: readinessItems() });
    }

    const accountMatch = path.match(/^\/accounts\/([^/]+)$/);
    if (accountMatch && request.method === 'GET') {
      return json({ account: demoAccount(decodeURIComponent(accountMatch[1])) });
    }

    const channelMatch = path.match(/^\/channels\/([^/]+)(?:\/(moderation|analytics))?$/);
    if (channelMatch && request.method === 'GET') {
      const channelId = decodeURIComponent(channelMatch[1]);
      const child = channelMatch[2];
      if (child === 'moderation') return json({ moderation: demoModeration() });
      if (child === 'analytics') return json({ analytics: demoAnalytics() });
      return json({ channel: demoChannel(channelId) });
    }

    const streamKeyMatch = path.match(/^\/channels\/([^/]+)\/stream-key(?:\/rotate)?$/);
    if (streamKeyMatch && (request.method === 'GET' || request.method === 'POST')) {
      return json({ streamKey: demoStreamKey(decodeURIComponent(streamKeyMatch[1])) });
    }

    const followersMatch = path.match(/^\/channels\/([^/]+)\/followers$/);
    if (followersMatch && request.method === 'GET') {
      return json({ followers: demoFollowers(decodeURIComponent(followersMatch[1])) });
    }

    const followMatch = path.match(/^\/channels\/([^/]+)\/follow$/);
    if (followMatch && request.method === 'POST') {
      const channelId = decodeURIComponent(followMatch[1]);
      return json({
        follow: {
          channelId,
          followerId: 'viewer_demo',
          notifications: true,
          followedAt: new Date().toISOString(),
        },
      });
    }

    const evaluateMatch = path.match(/^\/channels\/([^/]+)\/moderation\/evaluate$/);
    if (evaluateMatch && request.method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as {
        actorId?: unknown;
        message?: unknown;
      };
      return json(
        evaluateChatMessage(
          decodeURIComponent(evaluateMatch[1]),
          typeof body.actorId === 'string' ? body.actorId : 'unknown',
          typeof body.message === 'string' ? body.message : '',
        ),
      );
    }

    if (path === '/admin/safety/queue' && request.method === 'GET') {
      return json({ queue: demoSafetyQueue() });
    }

    if (path.match(/^\/admin\/safety\/queue\/[^/]+\/resolve$/) && request.method === 'POST') {
      return json({ event: { ...demoSafetyQueue()[0], status: 'resolved' } });
    }

    if (path === '/room-metadata' && request.method === 'POST') {
      let body: { roomName?: unknown; title?: unknown; hostId?: unknown; hostName?: unknown };
      try {
        const text = await request.text();
        body = text ? (JSON.parse(text) as typeof body) : {};
      } catch {
        return json({ error: 'invalid JSON' }, 400);
      }
      const { roomName, title, hostId, hostName } = body;
      if (!roomName || typeof roomName !== 'string') {
        return json({ error: 'roomName (string) is required' }, 400);
      }
      try {
        await updateStreamMetadata(env, roomName, {
          title: typeof title === 'string' ? title : roomName,
          hostId: typeof hostId === 'string' ? hostId : '',
          hostName: typeof hostName === 'string' ? hostName : '',
        });
        return json({ ok: true });
      } catch {
        return json({ error: 'failed to update metadata' }, 500);
      }
    }

    if (path !== '/token' || request.method !== 'POST') {
      return json({ error: 'not found' }, 404);
    }

    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    const maxPerMinute = Number(env.RATE_LIMIT_PER_MINUTE ?? 60);
    if (!checkRateLimit(ip, maxPerMinute)) {
      return json({ error: 'rate limit exceeded' }, 429);
    }

    let body: {
      identity?: unknown;
      name?: unknown;
      roomName?: unknown;
      role?: unknown;
    };
    try {
      const text = await request.text();
      if (text.length > 4096) {
        return json({ error: 'request body too large' }, 413);
      }
      body = text ? (JSON.parse(text) as typeof body) : {};
    } catch {
      return json({ error: 'invalid JSON' }, 400);
    }

    const { identity, name, roomName, role } = body;
    if (!identity || typeof identity !== 'string') {
      return json({ error: 'identity (string) is required' }, 400);
    }
    if (!IDENTITY_PATTERN.test(identity)) {
      return json({
        error: 'identity must be 1-64 chars of letters, digits, "_", "-", ".", "@"',
      }, 400);
    }
    if (!roomName || typeof roomName !== 'string') {
      return json({ error: 'roomName (string) is required' }, 400);
    }
    if (!ROOM_PATTERN.test(roomName)) {
      return json({
        error: 'roomName must be 1-128 chars of letters, digits, "_", "-"',
      }, 400);
    }
    if (!role || typeof role !== 'string' || !ROLES.has(role as ParticipantRole)) {
      return json({ error: 'role must be "host", "viewer", or "guest"' }, 400);
    }

    try {
      const result = await mintAccessToken(env, {
        identity,
        name: typeof name === 'string' && name.trim() ? name.trim() : identity,
        roomName,
        role: role as ParticipantRole,
      });
      return json(result);
    } catch {
      return json({ error: 'failed to generate token' }, 500);
    }
  },
};
