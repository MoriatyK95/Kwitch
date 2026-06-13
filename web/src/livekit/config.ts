/**
 * LiveKit client configuration — reads VITE_* env vars at build time.
 */
export interface LiveKitConfig {
  /** WebSocket URL for room.connect(). */
  url: string;
  /** Base URL for the token API. Empty = same-origin /token. */
  tokenServerUrl: string;
}

function env(key: keyof ImportMetaEnv): string {
  return (import.meta.env[key] ?? '').trim();
}

export const livekitConfig: LiveKitConfig = {
  url: env('VITE_LIVEKIT_URL'),
  tokenServerUrl: env('VITE_TOKEN_SERVER_URL'),
};

export function assertLiveKitConfig(): void {
  if (!livekitConfig.url) {
    throw new Error('VITE_LIVEKIT_URL is not set.');
  }
}
