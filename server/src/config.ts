/**
 * Centralised, validated environment configuration for the LiveKit API server.
 */
import 'dotenv/config';

export interface ServerConfig {
  /** LiveKit WebSocket URL (wss://…) passed to clients. */
  livekitUrl: string;
  /** LiveKit API key — server-only. */
  apiKey: string;
  /** LiveKit API secret — server-only. NEVER expose to the browser. */
  apiSecret: string;
  port: number;
  tokenExpireSeconds: number;
  corsOrigins: string[];
  rateLimitPerMinute: number;
  trustProxy: boolean;
  logLevel: string;
  nodeEnv: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const livekitUrl = env.LIVEKIT_URL ?? '';
  const apiKey = env.LIVEKIT_API_KEY ?? '';
  const apiSecret = env.LIVEKIT_API_SECRET ?? '';

  if (!livekitUrl || !apiKey || !apiSecret) {
    throw new Error(
      'Missing LIVEKIT_URL, LIVEKIT_API_KEY, or LIVEKIT_API_SECRET. Copy .env.example ' +
        'to server/.env and fill them in (get them from https://cloud.livekit.io).',
    );
  }

  return {
    livekitUrl,
    apiKey,
    apiSecret,
    port: Number(env.PORT ?? 3001),
    tokenExpireSeconds: Number(env.TOKEN_EXPIRE_SECONDS ?? 3600),
    corsOrigins: (env.CORS_ORIGIN ?? 'http://localhost:5173').split(',').map((o) => o.trim()),
    rateLimitPerMinute: Number(env.RATE_LIMIT_PER_MINUTE ?? 60),
    trustProxy: env.TRUST_PROXY === 'true' || env.TRUST_PROXY === '1',
    logLevel: env.LOG_LEVEL ?? 'info',
    nodeEnv: env.NODE_ENV ?? 'development',
  };
}
