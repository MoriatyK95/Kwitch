/**
 * A tiny reactive "who am I" store for the UI (chat labels, host vs viewer, etc.).
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

export function randomUserId(prefix = 'user'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function initSession(userId: string, userName: string): void {
  session.userId = userId;
  session.userName = userName;
  session.isLoggedIn = true;
}

export function roomNameForHost(hostId: string): string {
  return `live_${hostId}`;
}
