/**
 * Bootstrap: load + validate config, build the app, listen, and shut down
 * gracefully on SIGTERM/SIGINT (required for clean rolling deploys in
 * Docker/Kubernetes/Render/Fly — the platform sends SIGTERM and expects
 * in-flight requests to drain before the process exits).
 */
import { pino } from 'pino';
import { loadConfig } from './config.js';
import { createApp } from './app.js';

let config;
try {
  config = loadConfig();
} catch (err) {
  console.error(`\n✖ ${err instanceof Error ? err.message : err}\n`);
  process.exit(1);
}

const logger = pino({
  level: config.logLevel,
  // Pretty-print locally; emit structured JSON in production for log
  // aggregators (CloudWatch, Datadog, Loki…).
  transport:
    config.nodeEnv === 'development' ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
});

const app = createApp(config, logger);

const server = app.listen(config.port, () => {
  logger.info(
    {
      port: config.port,
      sdkAppId: config.sdkAppId,
      corsOrigins: config.corsOrigins,
      sigTtlSeconds: config.userSigExpireSeconds,
    },
    'UserSig server listening',
  );
});

function shutdown(signal: string) {
  logger.info({ signal }, 'shutting down gracefully');
  server.close((err) => {
    if (err) {
      logger.error({ err }, 'error during shutdown');
      process.exit(1);
    }
    process.exit(0);
  });
  // Hard kill if connections refuse to drain.
  setTimeout(() => {
    logger.warn('forced shutdown after 10s drain timeout');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'unhandled promise rejection');
});
