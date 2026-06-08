/**
 * Login orchestration: glue between our `getUserSig` abstraction and the
 * AtomicXCore SDK's `useLoginState`.
 *
 * Flow (identical in both modes — only getUserSig differs underneath):
 *   1. Resolve a UserSig for the userId (local sign OR server fetch).
 *   2. Call the SDK's login() with sdkAppId + userId + userSig.
 *   3. Mirror the identity into our local `session` store for the UI.
 */
import { useLoginState } from 'tuikit-atomicx-vue3';
import { trtcConfig } from './config';
import { getUserSig } from './userSig';
import { session } from './session';

/**
 * Log a user into TRTC. Safe to call once per app session.
 *
 * @param userId    Unique identity (avoid trivial values like "1"/"123").
 * @param userName  Display name shown in chat / viewer list.
 */
export async function loginToTrtc(userId: string, userName: string): Promise<void> {
  // 1. Get the credential. This is the ONE line that behaves differently
  //    between dev (client-signed) and prod (server-signed) modes.
  const userSig = await getUserSig(userId);

  // 2. Hand it to the SDK. After this resolves, every other AtomicXCore
  //    composable (live list, device, barrage, gifts...) is usable.
  const { login } = useLoginState();
  await login({
    sdkAppId: trtcConfig.sdkAppId,
    userId,
    userSig,
  });

  // 3. Remember who we are for the UI layer.
  session.userId = userId;
  session.userName = userName;
  session.isLoggedIn = true;
}
