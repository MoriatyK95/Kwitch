/**
 * Preflight environment check.
 *
 * Runs automatically before `npm run dev` and `npm run build` (see the
 * "predev" / "prebuild" scripts in package.json). Its only job is to fail
 * LOUDLY and CLEARLY if your TRTC credentials are missing or still set to the
 * placeholder values shipped in .env.example — so a newcomer never wastes time
 * debugging a blank screen that was really just an empty SDKAppID.
 *
 * It is intentionally dependency-free and reads .env.local the same way Vite
 * does (without the full dotenv stack) to stay fast and transparent.
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
    `${YELLOW}Fix: copy .env.example to web/.env.local and fill in your TRTC` +
      ` credentials.\nGet them from the TRTC Console: https://console.trtc.io/app${RESET}\n`,
  );
  process.exit(1);
}

if (!existsSync(envPath)) {
  fail('No web/.env.local file found. The app needs your TRTC SDKAppID to run.');
}

// Minimal .env parser: KEY=VALUE per line, ignoring blanks and comments.
const env = {};
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
}

const appId = env.VITE_SDK_APP_ID;
const mode = env.VITE_USERSIG_MODE || 'local';

if (!appId || appId === '0') {
  fail('VITE_SDK_APP_ID is missing or still set to the placeholder "0".');
}
if (!/^\d+$/.test(appId)) {
  fail(`VITE_SDK_APP_ID must be a number, got "${appId}".`);
}

if (mode === 'local') {
  const secret = env.VITE_SDK_SECRET_KEY;
  if (!secret) {
    fail(
      'VITE_USERSIG_MODE=local requires VITE_SDK_SECRET_KEY so the browser can ' +
        'sign a test UserSig.\nThis path is DEV-ONLY — see docs/LOCAL_VS_PRODUCTION.md.',
    );
  }
} else if (mode === 'server') {
  if (!env.VITE_USERSIG_SERVER_URL) {
    fail('VITE_USERSIG_MODE=server requires VITE_USERSIG_SERVER_URL pointing at your UserSig server.');
  }
} else {
  fail(`VITE_USERSIG_MODE must be "local" or "server", got "${mode}".`);
}

const note =
  mode === 'local'
    ? `${YELLOW}(dev-only client-side signing — never ship this to production)${RESET}`
    : `${GREEN}(server-signed — production-safe)${RESET}`;
console.log(`${GREEN}✔ Preflight OK${RESET} — SDKAppID set, UserSig mode = ${BOLD}${mode}${RESET} ${note}`);
