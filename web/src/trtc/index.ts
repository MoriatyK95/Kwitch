/**
 * Barrel export for the TRTC integration layer. Import from here so the rest
 * of the app has one tidy entry point:
 *
 *   import { getUserSig, loginToTrtc, session, trtcConfig } from '@/trtc';
 */
export { trtcConfig, isLocalSigMode } from './config';
export type { UserSigMode, TrtcConfig } from './config';
export { getUserSig } from './userSig';
export { genTestUserSig } from './genTestUserSig';
export { loginToTrtc } from './login';
export { session, randomUserId } from './session';
export type { Session } from './session';
