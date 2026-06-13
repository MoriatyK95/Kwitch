import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { pino } from 'pino';
import { createApp } from './app.js';
import { loadConfig, type ServerConfig } from './config.js';

const silentLogger = pino({ level: 'silent' });

function testConfig(overrides: Partial<ServerConfig> = {}): ServerConfig {
  return {
    livekitUrl: 'wss://example.livekit.cloud',
    apiKey: 'APItestkey',
    apiSecret: 'secret_test_key_for_jwt_signing_only',
    port: 0,
    tokenExpireSeconds: 600,
    corsOrigins: ['http://localhost:5173'],
    rateLimitPerMinute: 1000,
    trustProxy: false,
    logLevel: 'silent',
    nodeEnv: 'test',
    ...overrides,
  };
}

describe('config', () => {
  it('throws when credentials are missing', () => {
    expect(() => loadConfig({})).toThrow(/LIVEKIT_URL, LIVEKIT_API_KEY, or LIVEKIT_API_SECRET/);
  });

  it('parses a full environment', () => {
    const config = loadConfig({
      LIVEKIT_URL: 'wss://test.livekit.cloud',
      LIVEKIT_API_KEY: 'APIkey',
      LIVEKIT_API_SECRET: 'secret',
      PORT: '8080',
      TOKEN_EXPIRE_SECONDS: '120',
      CORS_ORIGIN: 'https://a.example, https://b.example',
      RATE_LIMIT_PER_MINUTE: '30',
      TRUST_PROXY: 'true',
    });
    expect(config.livekitUrl).toBe('wss://test.livekit.cloud');
    expect(config.apiKey).toBe('APIkey');
    expect(config.port).toBe(8080);
    expect(config.tokenExpireSeconds).toBe(120);
    expect(config.corsOrigins).toEqual(['https://a.example', 'https://b.example']);
    expect(config.rateLimitPerMinute).toBe(30);
    expect(config.trustProxy).toBe(true);
  });
});

describe('health endpoints', () => {
  const app = createApp(testConfig(), silentLogger);

  it.each(['/health', '/healthz'])('GET %s returns ok', async (path) => {
    const res = await request(app).get(path);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('GET /readyz returns ready', async () => {
    const res = await request(app).get('/readyz');
    expect(res.status).toBe(200);
    expect(res.body.ready).toBe(true);
  });
});

describe('POST /token', () => {
  const app = createApp(testConfig(), silentLogger);

  it('issues a token for a valid request', async () => {
    const res = await request(app).post('/token').send({
      identity: 'user_abc-123',
      name: 'Alice',
      roomName: 'live_user_abc',
      role: 'host',
    });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(20);
    expect(res.body.url).toBe('wss://example.livekit.cloud');
  });

  it('rejects a missing identity', async () => {
    const res = await request(app).post('/token').send({ roomName: 'live_x', role: 'viewer' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/identity/);
  });

  it('rejects invalid role', async () => {
    const res = await request(app).post('/token').send({
      identity: 'user1',
      roomName: 'live_user1',
      role: 'admin',
    });
    expect(res.status).toBe(400);
  });

  it('rejects identities with a hostile charset', async () => {
    const res = await request(app).post('/token').send({
      identity: '<script>',
      roomName: 'live_x',
      role: 'viewer',
    });
    expect(res.status).toBe(400);
  });

  it('rejects oversized request bodies', async () => {
    const res = await request(app)
      .post('/token')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ identity: 'ok', roomName: 'live_ok', role: 'host', padding: 'p'.repeat(10_000) }));
    expect(res.status).toBe(413);
  });

  it('rate-limits abusive clients', async () => {
    const limitedApp = createApp(testConfig({ rateLimitPerMinute: 2 }), silentLogger);
    const body = { identity: 'u1', roomName: 'live_u1', role: 'viewer' };
    await request(limitedApp).post('/token').send(body);
    await request(limitedApp).post('/token').send(body);
    const res = await request(limitedApp).post('/token').send(body);
    expect(res.status).toBe(429);
  });
});

describe('misc hardening', () => {
  const app = createApp(testConfig(), silentLogger);

  it('returns JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/nope');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('not found');
  });

  it('does not expose x-powered-by', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('sets security headers via helmet', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('allows the configured CORS origin', async () => {
    const res = await request(app).get('/health').set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('does not reflect unknown CORS origins', async () => {
    const res = await request(app).get('/health').set('Origin', 'https://evil.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('platform production APIs', () => {
  const app = createApp(testConfig(), silentLogger);

  it('returns production readiness items', async () => {
    const res = await request(app).get('/platform/readiness');
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.items.some((item: { area: string }) => item.area.includes('HLS'))).toBe(true);
  });

  it('returns channel moderation settings', async () => {
    const res = await request(app).get('/channels/demo/moderation');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.moderation.bannedWords)).toBe(true);
  });

  it('rotates stream keys for RTMP ingest', async () => {
    const before = await request(app).get('/channels/demo/stream-key');
    const after = await request(app).post('/channels/demo/stream-key/rotate');
    expect(after.status).toBe(200);
    expect(after.body.streamKey.key).not.toBe(before.body.streamKey.key);
  });

  it('evaluates chat messages against moderation policy', async () => {
    const res = await request(app)
      .post('/channels/demo/moderation/evaluate')
      .send({ actorId: 'viewer_1', message: 'check this scam http://bad.example' });
    expect(res.status).toBe(200);
    expect(res.body.allowed).toBe(false);
    expect(res.body.reasons.length).toBeGreaterThan(0);
  });
});
