/**
 * Kwitch Cloudflare Worker — UserSig API on the same origin as the Vue SPA.
 *
 * With `run_worker_first` in wrangler.jsonc, only API routes hit this script;
 * static assets and SPA navigation are served directly by Workers Assets.
 */
import { generateUserSig } from './usersig';

export interface Env {
  SDK_APP_ID: string;
  SDK_SECRET_KEY: string;
  USERSIG_EXPIRE_SECONDS?: string;
  RATE_LIMIT_PER_MINUTE?: string;
}

const USER_ID_PATTERN = /^[A-Za-z0-9_\-.@]{1,64}$/;

/** Per-isolate sliding window — good enough for demo abuse protection. */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function json(data: unknown, status = 200, extraHeaders?: HeadersInit): Response {
  return Response.json(data, { status, headers: extraHeaders });
}

function checkRateLimit(ip: string, max: number): boolean {
  const now = Date.now();
  const windowMs = 60_000;
  const entry = rateLimitStore.get(ip);
  if (!entry || now >= entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) {
    return false;
  }
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

    if (path !== '/usersig' || request.method !== 'POST') {
      return json({ error: 'not found' }, 404);
    }

    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    const maxPerMinute = Number(env.RATE_LIMIT_PER_MINUTE ?? 60);
    if (!checkRateLimit(ip, maxPerMinute)) {
      return json({ error: 'rate limit exceeded' }, 429);
    }

    const sdkAppId = Number(env.SDK_APP_ID);
    const sdkSecretKey = env.SDK_SECRET_KEY;
    if (!sdkAppId || !sdkSecretKey) {
      return json({ error: 'server not configured' }, 503);
    }

    let body: { userId?: unknown };
    try {
      const text = await request.text();
      if (text.length > 4096) {
        return json({ error: 'request body too large' }, 413);
      }
      body = text ? (JSON.parse(text) as { userId?: unknown }) : {};
    } catch {
      return json({ error: 'invalid JSON' }, 400);
    }

    const { userId } = body;
    if (!userId || typeof userId !== 'string') {
      return json({ error: 'userId (string) is required' }, 400);
    }
    if (!USER_ID_PATTERN.test(userId)) {
      return json({
        error: 'userId must be 1-64 chars of letters, digits, "_", "-", ".", "@"',
      }, 400);
    }

    const expire = Number(env.USERSIG_EXPIRE_SECONDS ?? 3600);
    try {
      const userSig = await generateUserSig(sdkAppId, sdkSecretKey, userId, expire);
      return json({ userSig, expire });
    } catch {
      return json({ error: 'failed to generate userSig' }, 500);
    }
  },
};
