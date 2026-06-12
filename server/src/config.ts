/**
 * Centralised, validated environment configuration for the UserSig server.
 * Fails fast at startup with a clear message instead of misbehaving later.
 */
import 'dotenv/config';

export interface ServerConfig {
  /** TRTC SDKAppID — identifies your application to Tencent. */
  sdkAppId: number;
  /** TRTC SDKSecretKey — server-only. NEVER expose to the browser. */
  sdkSecretKey: string;
  /** TCP port to listen on. */
  port: number;
  /** How long an issued UserSig stays valid, in seconds. */
  userSigExpireSeconds: number;
  /** Allowed CORS origins (your frontend URLs). */
  corsOrigins: string[];
  /** Max /usersig requests per IP per minute. */
  rateLimitPerMinute: number;
  /** Express "trust proxy" setting — enable when behind a load balancer. */
  trustProxy: boolean;
  /** Log level for pino. */
  logLevel: string;
  /** NODE_ENV, defaulting to development. */
  nodeEnv: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const sdkAppId = Number(env.SDK_APP_ID ?? 0);
  const sdkSecretKey = env.SDK_SECRET_KEY ?? '';

  if (!sdkAppId || !sdkSecretKey) {
    throw new Error(
      'Missing SDK_APP_ID or SDK_SECRET_KEY. Copy .env.example to server/.env ' +
        'and fill them in (get them from https://console.trtc.io/app).',
    );
  }

  return {
    sdkAppId,
    sdkSecretKey,
    port: Number(env.PORT ?? 3001),
    userSigExpireSeconds: Number(env.USERSIG_EXPIRE_SECONDS ?? 3600),
    corsOrigins: (env.CORS_ORIGIN ?? 'http://localhost:5173').split(',').map((o) => o.trim()),
    rateLimitPerMinute: Number(env.RATE_LIMIT_PER_MINUTE ?? 60),
    trustProxy: env.TRUST_PROXY === 'true' || env.TRUST_PROXY === '1',
    logLevel: env.LOG_LEVEL ?? 'info',
    nodeEnv: env.NODE_ENV ?? 'development',
  };
}
