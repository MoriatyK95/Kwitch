/**
 * Central, typed access to the TRTC-related environment configuration.
 *
 * Everything the rest of the app needs to know about *how we authenticate*
 * lives here, read once from Vite's `import.meta.env`. Keeping it in one place
 * means there is a single source of truth for the SDKAppID and the chosen
 * UserSig mode.
 */

export type UserSigMode = 'local' | 'server';

export interface TrtcConfig {
  /** TRTC SDKAppID — identifies your application to Tencent. */
  sdkAppId: number;
  /** Which credential strategy is active: client-side test sig vs server sig. */
  userSigMode: UserSigMode;
  /** DEV-ONLY secret key, present only in `local` mode. */
  sdkSecretKey: string;
  /** Base URL of the UserSig backend, used only in `server` mode. */
  userSigServerUrl: string;
}

const sdkAppId = Number(import.meta.env.VITE_SDK_APP_ID ?? 0);
const userSigMode = (import.meta.env.VITE_USERSIG_MODE ?? 'local') as UserSigMode;

export const trtcConfig: TrtcConfig = {
  sdkAppId,
  userSigMode,
  sdkSecretKey: import.meta.env.VITE_SDK_SECRET_KEY ?? '',
  userSigServerUrl: import.meta.env.VITE_USERSIG_SERVER_URL ?? '',
};

/** True when running the insecure, client-side-signing development path. */
export const isLocalSigMode = userSigMode === 'local';

if (!sdkAppId) {
  // This should have been caught by scripts/preflight.mjs, but a runtime guard
  // gives a clear console error if someone bypasses the npm scripts.
  console.error(
    '[TRTC] VITE_SDK_APP_ID is not set. Copy .env.example to web/.env.local and fill it in.',
  );
}
