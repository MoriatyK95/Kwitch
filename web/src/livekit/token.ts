import { livekitConfig } from './config';
import type { ParticipantRole } from './types';

export interface TokenResponse {
  token: string;
  url: string;
}

function tokenEndpoint(): string {
  const base = livekitConfig.tokenServerUrl.replace(/\/$/, '');
  return base ? `${base}/token` : '/token';
}

export async function fetchAccessToken(
  identity: string,
  name: string,
  roomName: string,
  role: ParticipantRole,
): Promise<TokenResponse> {
  const res = await fetch(tokenEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity, name, roomName, role }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || `Token request failed (${res.status})`);
  }
  return res.json() as Promise<TokenResponse>;
}
