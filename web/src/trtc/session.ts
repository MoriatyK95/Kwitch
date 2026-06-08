/**
 * A tiny reactive "who am I" store. AtomicXCore tracks the logged-in user
 * internally, but the demo UI also needs the current userId/userName handy
 * (to label chat messages, decide host-vs-viewer, etc.), so we keep a thin
 * mirror here. This is plain Vue reactivity — no SDK magic.
 */
import { reactive } from 'vue';

export interface Session {
  userId: string;
  userName: string;
  isLoggedIn: boolean;
}

export const session = reactive<Session>({
  userId: '',
  userName: '',
  isLoggedIn: false,
});

/** Generate a random, SDK-safe userId (letters, numbers, underscore). */
export function randomUserId(prefix = 'user'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
