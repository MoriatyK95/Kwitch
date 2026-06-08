<script setup lang="ts">
/**
 * Co-guest / "guest star" — a viewer requests to join the stream on camera,
 * and the host approves or rejects.
 *
 * Powered by AtomicXCore's `useCoGuestState`:
 *   Viewer side: `applyForSeat({ seatIndex, timeout })` / `cancelApplication()`
 *   Host side:   `applicants` list + `acceptApplication({ userId })` /
 *                `rejectApplication({ userId })`
 *   Shared:      `connected` list of users currently on a seat
 *
 * The component adapts its UI based on the `isHost` prop.
 */
import { useCoGuestState } from 'tuikit-atomicx-vue3';

defineProps<{ isHost: boolean }>();

const {
  connected,
  applicants,
  applyForSeat,
  cancelApplication,
  acceptApplication,
  rejectApplication,
} = useCoGuestState();

// Viewer: ask to come on stream. seatIndex -1 means "any free seat".
function requestToJoin() {
  applyForSeat({ seatIndex: -1, timeout: 30 }).catch((e) =>
    console.warn('[co-guest] apply failed', e),
  );
}
</script>

<template>
  <div class="coguest">
    <div class="coguest-header">Guest Star</div>

    <!-- Host view: pending requests to approve. -->
    <template v-if="isHost">
      <p v-if="applicants.length === 0" class="hint">No join requests.</p>
      <div v-for="a in applicants" :key="a.userId" class="row">
        <span>{{ a.userName || a.userId }} wants to join</span>
        <span class="actions">
          <button class="primary" @click="acceptApplication({ userId: a.userId })">
            Accept
          </button>
          <button @click="rejectApplication({ userId: a.userId })">Decline</button>
        </span>
      </div>
    </template>

    <!-- Viewer view: request / cancel. -->
    <template v-else>
      <button class="primary" @click="requestToJoin">Request to join on camera</button>
      <button @click="cancelApplication()">Cancel request</button>
    </template>

    <div v-if="connected.length" class="connected">
      On stream: {{ connected.map((c) => c.userName || c.userId).join(', ') }}
    </div>
  </div>
</template>

<style scoped>
.coguest {
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.coguest-header {
  font-weight: 700;
  font-size: 13px;
  text-transform: uppercase;
  color: var(--text-dim);
}
.hint {
  font-size: 13px;
  color: var(--text-dim);
  margin: 0;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
}
.actions {
  display: flex;
  gap: 6px;
}
.connected {
  font-size: 12px;
  color: var(--text-dim);
  border-top: 1px solid var(--border);
  padding-top: 8px;
}
</style>
