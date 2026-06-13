<script setup lang="ts">
import { useLiveKitRoomContext, useGuestRequests, session } from '@/livekit';

defineProps<{ isHost: boolean }>();

const roomRef = useLiveKitRoomContext();
const { applicants, acceptedGuests, guestAccepted, requestGuest, acceptGuest, declineGuest } =
  useGuestRequests(roomRef, () => session.userId);

function requestToJoin() {
  requestGuest(session.userId, session.userName).catch((e) =>
    console.warn('[co-guest] apply failed', e),
  );
}
</script>

<template>
  <div class="coguest panel">
    <div class="panel-header">Guest Star</div>
    <div class="body">
      <template v-if="isHost">
        <p v-if="applicants.length === 0" class="hint">No join requests.</p>
        <div v-for="a in applicants" :key="a.identity" class="row">
          <span>{{ a.name || a.identity }} wants to join</span>
          <span class="actions">
            <button class="primary" @click="acceptGuest(a.identity)">Accept</button>
            <button @click="declineGuest(a.identity)">Decline</button>
          </span>
        </div>
      </template>
      <template v-else>
        <button class="brand" @click="requestToJoin">Request to join on camera</button>
        <p v-if="guestAccepted" class="hint accepted">
          Accepted! Rejoin with guest permissions to publish your camera.
        </p>
      </template>
      <div v-if="acceptedGuests.length" class="connected">
        On stream: {{ acceptedGuests.join(', ') }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.body {
  padding: var(--space-3) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.hint {
  margin: 0;
  font-size: var(--font-sm);
  color: var(--text-muted);
}

.hint.accepted {
  color: var(--brand);
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  font-size: var(--font-sm);
}

.actions {
  display: flex;
  gap: 6px;
}

.connected {
  font-size: var(--font-xs);
  color: var(--text-dim);
  border-top: 1px solid var(--border);
  padding-top: var(--space-2);
  margin-top: var(--space-1);
}
</style>
