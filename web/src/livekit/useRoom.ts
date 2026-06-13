import { ref, onUnmounted, type Ref } from 'vue';
import {
  Room,
  RoomEvent,
  Track,
  createLocalVideoTrack,
  createLocalAudioTrack,
  type LocalVideoTrack,
  type LocalAudioTrack,
  type RemoteTrack,
  type RemoteParticipant,
} from 'livekit-client';
import { fetchAccessToken } from './token';
import { livekitConfig } from './config';
import type { ParticipantRole } from './types';

export function useLiveKitRoom(roomRef: Ref<Room | null>) {
  const connecting = ref(false);
  const connected = ref(false);
  const error = ref('');

  let localVideo: LocalVideoTrack | null = null;
  let localAudio: LocalAudioTrack | null = null;

  async function connect(
    identity: string,
    name: string,
    roomName: string,
    role: ParticipantRole,
    options?: { cameraId?: string; micId?: string },
  ): Promise<Room> {
    connecting.value = true;
    error.value = '';
    try {
      const { token, url } = await fetchAccessToken(identity, name, roomName, role);
      const wsUrl = url || livekitConfig.url;
      const room = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.value = room;

      await room.connect(wsUrl, token);

      if (role === 'host' || role === 'guest') {
        localAudio = await createLocalAudioTrack(
          options?.micId ? { deviceId: options.micId } : undefined,
        );
        localVideo = await createLocalVideoTrack(
          options?.cameraId ? { deviceId: options.cameraId } : undefined,
        );
        await room.localParticipant.publishTrack(localAudio);
        await room.localParticipant.publishTrack(localVideo);
      }

      connected.value = true;
      return room;
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
      await disconnect();
      throw e;
    } finally {
      connecting.value = false;
    }
  }

  async function disconnect(): Promise<void> {
    localVideo?.stop();
    localAudio?.stop();
    localVideo = null;
    localAudio = null;
    if (roomRef.value) {
      await roomRef.value.disconnect().catch(() => {});
      roomRef.value = null;
    }
    connected.value = false;
  }

  function attachLocalVideo(el: HTMLVideoElement | null): void {
    if (el && localVideo) {
      localVideo.attach(el);
    }
  }

  function attachRemoteVideo(
    el: HTMLVideoElement | null,
    participant?: RemoteParticipant,
  ): void {
    if (!el || !roomRef.value) return;
    const target = participant ?? findHostParticipant(roomRef.value);
    if (!target) return;
    for (const pub of target.trackPublications.values()) {
      if (pub.kind === Track.Kind.Video && pub.track) {
        (pub.track as RemoteTrack).attach(el);
        return;
      }
    }
  }

  function findHostParticipant(room: Room): RemoteParticipant | undefined {
    for (const p of room.remoteParticipants.values()) {
      for (const pub of p.trackPublications.values()) {
        if (pub.kind === Track.Kind.Video && pub.isSubscribed) {
          return p;
        }
      }
    }
    return room.remoteParticipants.values().next().value;
  }

  function onRemoteVideo(el: HTMLVideoElement | null, handler: () => void): () => void {
    const room = roomRef.value;
    if (!room || !el) return () => {};

    const tryAttach = () => {
      attachRemoteVideo(el);
      handler();
    };

    room.on(RoomEvent.TrackSubscribed, tryAttach);
    room.on(RoomEvent.ParticipantConnected, tryAttach);
    tryAttach();

    return () => {
      room.off(RoomEvent.TrackSubscribed, tryAttach);
      room.off(RoomEvent.ParticipantConnected, tryAttach);
    };
  }

  onUnmounted(() => {
    disconnect().catch(() => {});
  });

  return {
    connecting,
    connected,
    error,
    connect,
    disconnect,
    attachLocalVideo,
    attachRemoteVideo,
    onRemoteVideo,
    getLocalVideoTrack: () => localVideo,
    getLocalAudioTrack: () => localAudio,
  };
}

export function viewerCount(room: Room | null): number {
  if (!room) return 0;
  return room.remoteParticipants.size + (room.localParticipant ? 1 : 0);
}

export function participantList(room: Room | null): { identity: string; name: string }[] {
  if (!room) return [];
  const list: { identity: string; name: string }[] = [];
  if (room.localParticipant) {
    list.push({
      identity: room.localParticipant.identity,
      name: room.localParticipant.name || room.localParticipant.identity,
    });
  }
  for (const p of room.remoteParticipants.values()) {
    list.push({ identity: p.identity, name: p.name || p.identity });
  }
  return list;
}
