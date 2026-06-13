/**
 * Preflight environment check for LiveKit configuration.
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env.local');

const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

function fail(message) {
  console.error(`\n${RED}${BOLD}✖ Preflight check failed${RESET}\n`);
  console.error(`${RED}${message}${RESET}\n`);
  console.error(
    `${YELLOW}Fix (local dev): copy .env.example to web/.env.local and fill in LiveKit` +
      ` credentials.\nFix (CI / cloud builds): set VITE_LIVEKIT_URL as an environment` +
      ` variable.\nGet credentials from: https://cloud.livekit.io${RESET}\n`,
  );
  process.exit(1);
}

const env = {};
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
}

for (const key of ['VITE_LIVEKIT_URL', 'VITE_TOKEN_SERVER_URL']) {
  if (process.env[key] !== undefined && process.env[key] !== '') {
    env[key] = process.env[key];
  }
}

if (Object.keys(env).length === 0) {
  fail(
    'No configuration found. Neither web/.env.local exists nor are VITE_* ' +
      'environment variables set.',
  );
}

const livekitUrl = env.VITE_LIVEKIT_URL;

if (!livekitUrl) {
  fail('VITE_LIVEKIT_URL is missing. Set your LiveKit project WebSocket URL.');
}
if (!livekitUrl.startsWith('wss://') && !livekitUrl.startsWith('ws://')) {
  fail(`VITE_LIVEKIT_URL must start with wss:// or ws://, got "${livekitUrl}".`);
}

if (!env.VITE_TOKEN_SERVER_URL) {
  console.log(
    `${YELLOW}ℹ VITE_TOKEN_SERVER_URL is empty — using same-origin mode: the app will` +
      ` POST to /token on its own origin.\n  Works with Docker (nginx proxy), Cloudflare` +
      ` Workers, and the Vite dev server proxy.${RESET}`,
  );
}

console.log(
  `${GREEN}✔ Preflight OK${RESET} — LiveKit URL set ${GREEN}(server-signed tokens — production-safe)${RESET}`,
);
