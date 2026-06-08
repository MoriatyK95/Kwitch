/**
 * ★ THE CORE TEACHING ABSTRACTION ★
 * ---------------------------------------------------------------------------
 * This is the SINGLE place in the entire app where the two operating modes
 * differ. Everything else — login, going live, watching, chat — is identical
 * regardless of how the UserSig was obtained.
 *
 *   Mode A (local):  sign on the client with the test helper. Fast & insecure.
 *   Mode B (server): ask our backend to sign with the secret key it holds.
 *
 * Read docs/LOCAL_VS_PRODUCTION.md for the full "why".
 */
import { trtcConfig } from './config';
import { genTestUserSig } from './genTestUserSig';

/**
 * Obtain a UserSig for the given userId using whichever mode is configured.
 *
 * @param userId  The identity to mint a credential for.
 * @returns       A UserSig string ready to pass to the SDK's `login()`.
 */
export async function getUserSig(userId: string): Promise<string> {
  if (trtcConfig.userSigMode === 'server') {
    return getUserSigFromServer(userId);
  }
  return getUserSigLocally(userId);
}

/**
 * Mode A — DEV ONLY. Sign in the browser. The secret key is in the bundle.
 * Loudly guard-railed: refuses to run if the secret key is missing.
 */
function getUserSigLocally(userId: string): string {
  if (!trtcConfig.sdkSecretKey) {
    throw new Error(
      '[getUserSig] local mode needs VITE_SDK_SECRET_KEY. ' +
        'Set it in web/.env.local, or switch VITE_USERSIG_MODE=server.',
    );
  }
  // ⚠️ This call embeds your secret key in client code — DEV ONLY.
  return genTestUserSig(trtcConfig.sdkAppId, trtcConfig.sdkSecretKey, userId);
}

/**
 * Mode B — PRODUCTION. The client never sees the secret key. We POST the
 * userId to our backend, which signs server-side and returns a short-lived
 * UserSig. In a real app this request would also carry the user's app auth
 * token so the server can verify *who* is asking before issuing a sig.
 */
async function getUserSigFromServer(userId: string): Promise<string> {
  const res = await fetch(`${trtcConfig.userSigServerUrl}/usersig`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) {
    throw new Error(`[getUserSig] server returned ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { userSig?: string; error?: string };
  if (!data.userSig) {
    throw new Error(`[getUserSig] server did not return a userSig: ${data.error ?? 'unknown error'}`);
  }
  return data.userSig;
}
