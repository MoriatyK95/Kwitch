import { ref, watch, type Ref } from 'vue';
import { RoomEvent, type Room } from 'livekit-client';
import type { ChatMessage, DataMessage, GuestRequest } from './types';
import { DATA_TOPIC } from './types';

let messageSeq = 0;

function encode(msg: DataMessage): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(msg));
}

function decode(raw: Uint8Array): DataMessage | null {
  try {
    return JSON.parse(new TextDecoder().decode(raw)) as DataMessage;
  } catch {
    return null;
  }
}

export function useRoomChat(roomRef: Ref<Room | null>) {
  const messages = ref<ChatMessage[]>([]);
  const totalLikes = ref(0);

  function pushChat(text: string, identity: string, name: string): void {
    messages.value.push({
      id: String(++messageSeq),
      identity,
      name,
      text,
      at: Date.now(),
    });
  }

  async function sendChat(text: string, identity: string, name: string): Promise<void> {
    const room = roomRef.value;
    if (!room) return;
    const msg: DataMessage = { type: 'chat', text, identity, name };
    await room.localParticipant.publishData(encode(msg), { reliable: true, topic: DATA_TOPIC });
    pushChat(text, identity, name);
  }

  async function sendLike(identity: string, count = 1): Promise<void> {
    const room = roomRef.value;
    if (!room) return;
    const msg: DataMessage = { type: 'like', count, identity };
    await room.localParticipant.publishData(encode(msg), { reliable: true, topic: DATA_TOPIC });
    totalLikes.value += count;
  }

  watch(
    roomRef,
    (room, _, onCleanup) => {
      if (!room) return;
      const onData = (payload: Uint8Array, _p?: unknown, _k?: unknown, topic?: string) => {
        if (topic && topic !== DATA_TOPIC) return;
        const msg = decode(payload);
        if (!msg) return;
        if (msg.type === 'chat') {
          pushChat(msg.text, msg.identity, msg.name);
        } else if (msg.type === 'like') {
          totalLikes.value += msg.count;
        }
      };
      room.on(RoomEvent.DataReceived, onData);
      onCleanup(() => room.off(RoomEvent.DataReceived, onData));
    },
    { immediate: true },
  );

  return { messages, totalLikes, sendChat, sendLike };
}

export function useGuestRequests(roomRef: Ref<Room | null>, localIdentity: () => string) {
  const applicants = ref<GuestRequest[]>([]);
  const acceptedGuests = ref<string[]>([]);
  const guestAccepted = ref(false);

  async function requestGuest(identity: string, name: string): Promise<void> {
    const room = roomRef.value;
    if (!room) return;
    const msg: DataMessage = { type: 'guest-request', identity, name };
    await room.localParticipant.publishData(encode(msg), { reliable: true, topic: DATA_TOPIC });
  }

  async function acceptGuest(identity: string): Promise<void> {
    const room = roomRef.value;
    if (!room) return;
    applicants.value = applicants.value.filter((a) => a.identity !== identity);
    acceptedGuests.value.push(identity);
    const msg: DataMessage = { type: 'guest-accept', identity };
    await room.localParticipant.publishData(encode(msg), { reliable: true, topic: DATA_TOPIC });
  }

  async function declineGuest(identity: string): Promise<void> {
    const room = roomRef.value;
    if (!room) return;
    applicants.value = applicants.value.filter((a) => a.identity !== identity);
    const msg: DataMessage = { type: 'guest-decline', identity };
    await room.localParticipant.publishData(encode(msg), { reliable: true, topic: DATA_TOPIC });
  }

  watch(
    roomRef,
    (room, _, onCleanup) => {
      if (!room) return;
      const onData = (payload: Uint8Array, _p?: unknown, _k?: unknown, topic?: string) => {
        if (topic && topic !== DATA_TOPIC) return;
        const msg = decode(payload);
        if (!msg) return;
        if (msg.type === 'guest-request') {
          if (!applicants.value.some((a) => a.identity === msg.identity)) {
            applicants.value.push({ identity: msg.identity, name: msg.name });
          }
        } else if (msg.type === 'guest-accept' && msg.identity === localIdentity()) {
          guestAccepted.value = true;
        }
      };
      room.on(RoomEvent.DataReceived, onData);
      onCleanup(() => room.off(RoomEvent.DataReceived, onData));
    },
    { immediate: true },
  );

  return {
    applicants,
    acceptedGuests,
    guestAccepted,
    requestGuest,
    acceptGuest,
    declineGuest,
  };
}
