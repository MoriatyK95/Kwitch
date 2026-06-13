/**
 * TRTC UserSig generation for Cloudflare Workers.
 *
 * Faithful port of Tencent's tls-sig-api-v2 algorithm using Web Crypto
 * (HMAC-SHA256) and pako (zlib deflate). Produces signatures identical to the
 * Node server and the browser dev helper in src/trtc/genTestUserSig.ts.
 */
import pako from 'pako';

function base64url(base64: string): string {
  return base64.replace(/\+/g, '*').replace(/\//g, '-').replace(/=/g, '_');
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

async function hmacSha256Base64(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message));
  return bytesToBase64(new Uint8Array(sig));
}

export async function generateUserSig(
  sdkAppId: number,
  secretKey: string,
  userId: string,
  expire: number,
): Promise<string> {
  const currTime = Math.floor(Date.now() / 1000);

  const content =
    `TLS.identifier:${userId}\n` +
    `TLS.sdkappid:${sdkAppId}\n` +
    `TLS.time:${currTime}\n` +
    `TLS.expire:${expire}\n`;
  const sig = await hmacSha256Base64(secretKey, content);

  const sigDoc = {
    'TLS.ver': '2.0',
    'TLS.identifier': String(userId),
    'TLS.sdkappid': Number(sdkAppId),
    'TLS.time': Number(currTime),
    'TLS.expire': Number(expire),
    'TLS.sig': sig,
  };
  const compressed = pako.deflate(JSON.stringify(sigDoc));
  return base64url(bytesToBase64(compressed));
}
