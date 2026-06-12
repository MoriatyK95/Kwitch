import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { pino } from 'pino';
import { createApp } from './app.js';
import { loadConfig, type ServerConfig } from './config.js';

const silentLogger = pino({ level: 'silent' });

function testConfig(overrides: Partial<ServerConfig> = {}): ServerConfig {
  return {
    sdkAppId: 1400000000,
    sdkSecretKey: 'a'.repeat(64),
    port: 0,
    userSigExpireSeconds: 600,
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
    expect(() => loadConfig({})).toThrow(/SDK_APP_ID or SDK_SECRET_KEY/);
  });

  it('parses a full environment', () => {
    const config = loadConfig({
      SDK_APP_ID: '1400123456',
      SDK_SECRET_KEY: 'secret',
      PORT: '8080',
      USERSIG_EXPIRE_SECONDS: '120',
      CORS_ORIGIN: 'https://a.example, https://b.example',
      RATE_LIMIT_PER_MINUTE: '30',
      TRUST_PROXY: 'true',
    });
    expect(config.sdkAppId).toBe(1400123456);
    expect(config.port).toBe(8080);
    expect(config.userSigExpireSeconds).toBe(120);
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

describe('POST /usersig', () => {
  const app = createApp(testConfig(), silentLogger);

  it('issues a sig for a valid userId', async () => {
    const res = await request(app).post('/usersig').send({ userId: 'user_abc-123' });
    expect(res.status).toBe(200);
    expect(typeof res.body.userSig).toBe('string');
    expect(res.body.userSig.length).toBeGreaterThan(20);
    expect(res.body.expire).toBe(600);
  });

  it('rejects a missing userId', async () => {
    const res = await request(app).post('/usersig').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/userId/);
  });

  it('rejects a non-string userId', async () => {
    const res = await request(app).post('/usersig').send({ userId: 42 });
    expect(res.status).toBe(400);
  });

  it('rejects userIds with a hostile charset', async () => {
    const res = await request(app)
      .post('/usersig')
      .send({ userId: '<script>alert(1)</script>' });
    expect(res.status).toBe(400);
  });

  it('rejects userIds longer than 64 chars', async () => {
    const res = await request(app)
      .post('/usersig')
      .send({ userId: 'x'.repeat(65) });
    expect(res.status).toBe(400);
  });

  it('rejects oversized request bodies', async () => {
    const res = await request(app)
      .post('/usersig')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ userId: 'ok', padding: 'p'.repeat(10_000) }));
    expect(res.status).toBe(413);
  });

  it('rate-limits abusive clients', async () => {
    const limitedApp = createApp(testConfig({ rateLimitPerMinute: 2 }), silentLogger);
    await request(limitedApp).post('/usersig').send({ userId: 'u1' });
    await request(limitedApp).post('/usersig').send({ userId: 'u1' });
    const res = await request(limitedApp).post('/usersig').send({ userId: 'u1' });
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
