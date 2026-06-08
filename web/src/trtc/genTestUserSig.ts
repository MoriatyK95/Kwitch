/**
 * ⚠️  DEV-ONLY  ⚠️  Client-side UserSig generation.
 * ---------------------------------------------------------------------------
 * This file reproduces Tencent's official `genTestUserSig` algorithm in the
 * browser so you can get the demo running in minutes WITHOUT a backend.
 *
 * WHY THIS IS UNSAFE FOR PRODUCTION:
 *   To sign a UserSig you need the SDKSecretKey. Doing it here means that key
 *   is bundled into your JavaScript and shipped to every visitor's browser —
 *   anyone can open devtools, read it, and mint UserSigs for ANY user in your
 *   app. In production you MUST sign on a server you control (see
 *   ../trtc/userSig.ts `server` mode and ../../server/).
 *
 * The algorithm below is a faithful, dependency-light port of the official
 * Node implementation in `tls-sig-api-v2` (TLSSigAPIv2.js):
 *   1. Build a canonical "TLS.*" string from identifier/appid/time/expire.
 *   2. HMAC-SHA256 it with the secret key -> base64. (TLS.sig)
 *   3. Wrap the fields + sig in a JSON doc, zlib-deflate it, base64url-encode.
 * We use `js-sha256` for the HMAC and `pako` for the deflate, both of which
 * run in the browser (Node's `crypto`/`zlib` are not available client-side).
 */
import { sha256 } from 'js-sha256';
import pako from 'pako';

/** base64url variant Tencent uses: + -> *, / -> -, = -> _ */
function base64url(base64: string): string {
  return base64.replace(/\+/g, '*').replace(/\//g, '-').replace(/=/g, '_');
}

/** Encode a Uint8Array to standard base64 (browser-safe). */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Generate a development UserSig entirely in the browser.
 *
 * @param sdkAppId   Your TRTC SDKAppID.
 * @param secretKey  Your TRTC SDKSecretKey (DEV ONLY — never ship this).
 * @param userId     The user identity the sig is being minted for.
 * @param expire     Validity in seconds (default 7 days).
 */
export function genTestUserSig(
  sdkAppId: number,
  secretKey: string,
  userId: string,
  expire = 604800,
): string {
  const currTime = Math.floor(Date.now() / 1000);

  // Step 1+2: HMAC-SHA256 over the canonical content string.
  const content =
    `TLS.identifier:${userId}\n` +
    `TLS.sdkappid:${sdkAppId}\n` +
    `TLS.time:${currTime}\n` +
    `TLS.expire:${expire}\n`;
  const hmac = sha256.hmac.create(secretKey);
  hmac.update(content);
  const sig = bytesToBase64(new Uint8Array(hmac.arrayBuffer()));

  // Step 3: assemble the signature document, deflate, base64url-encode.
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
