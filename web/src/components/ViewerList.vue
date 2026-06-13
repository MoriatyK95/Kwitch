<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RoomEvent } from 'livekit-client';
import { useLiveKitRoomContext, participantList } from '@/livekit';

const roomRef = useLiveKitRoomContext();
const tick = ref(0);

watch(
  roomRef,
  (room, _, onCleanup) => {
    if (!room) return;
    const bump = () => {
      tick.value++;
    };
    room.on(RoomEvent.ParticipantConnected, bump);
    room.on(RoomEvent.ParticipantDisconnected, bump);
    onCleanup(() => {
      room.off(RoomEvent.ParticipantConnected, bump);
      room.off(RoomEvent.ParticipantDisconnected, bump);
    });
  },
  { immediate: true },
);

const audienceList = computed(() => {
  tick.value;
  return participantList(roomRef.value);
});
const audienceCount = computed(() => Math.max(0, audienceList.value.length - 1));
const localIdentity = computed(() => roomRef.value?.localParticipant?.identity ?? '');

const viewers = computed(() =>
  audienceList.value.filter((p) => p.identity !== localIdentity.value),
);
</script>

<template>
  <div class="viewers">
    <div class="viewers-header">
      <span class="live-dot" />
      <span class="count">{{ audienceCount }}</span>
      <span class="label">viewers</span>
    </div>
    <ul class="viewers-list">
      <li v-if="viewers.length === 0" class="empty">No viewers yet</li>
      <li v-for="v in viewers" :key="v.identity" class="viewer-item">
        <span class="avatar">{{ (v.name || v.identity).charAt(0).toUpperCase() }}</span>
        {{ v.name || v.identity }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.viewers {
  flex-shrink: 0;
  border-bottom: 1px solid var(--border);
  padding: var(--space-3) var(--space-4);
}

.viewers-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: var(--font-sm);
  margin-bottom: var(--space-2);
}

.count {
  color: var(--brand);
}

.label {
  color: var(--text-dim);
}

.viewers-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 120px;
  overflow-y: auto;
  font-size: var(--font-sm);
  color: var(--text-dim);
}

.viewer-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 3px 0;
}

.avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--bg-elev-3);
  display: grid;
  place-items: center;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
}

.empty {
  color: var(--text-muted);
}
</style>
