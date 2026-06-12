<script setup lang="ts">
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

function requestToJoin() {
  applyForSeat({ seatIndex: -1, timeout: 30 }).catch((e) =>
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
        <div v-for="a in applicants" :key="a.userId" class="row">
          <span>{{ a.userName || a.userId }} wants to join</span>
          <span class="actions">
            <button class="primary" @click="acceptApplication({ userId: a.userId })">Accept</button>
            <button @click="rejectApplication({ userId: a.userId })">Decline</button>
          </span>
        </div>
      </template>
      <template v-else>
        <button class="brand" @click="requestToJoin">Request to join on camera</button>
        <button class="ghost" @click="cancelApplication()">Cancel request</button>
      </template>
      <div v-if="connected.length" class="connected">
        On stream: {{ connected.map((c) => c.userName || c.userId).join(', ') }}
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
