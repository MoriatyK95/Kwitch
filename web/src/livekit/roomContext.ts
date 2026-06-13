import { inject, provide, type Ref } from 'vue';
import type { Room } from 'livekit-client';

const ROOM_KEY = Symbol('livekit-room');

export function provideLiveKitRoom(room: Ref<Room | null>): void {
  provide(ROOM_KEY, room);
}

export function useLiveKitRoomContext(): Ref<Room | null> {
  const room = inject<Ref<Room | null>>(ROOM_KEY);
  if (!room) {
    throw new Error('LiveKit room context is not available');
  }
  return room;
}

export function useOptionalLiveKitRoom(): Ref<Room | null> | undefined {
  return inject<Ref<Room | null>>(ROOM_KEY);
}
