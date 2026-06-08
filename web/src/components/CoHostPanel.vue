<script setup lang="ts">
/**
 * Host vs. host co-host / PK / raid — connect two broadcasters across rooms.
 *
 * Powered by AtomicXCore's `useCoHostState`:
 *   - `getCoHostCandidates(cursor)`  pages the list of other live hosts you
 *                                    can connect with -> `candidates`
 *   - `requestHostConnection({ liveId, layoutTemplate, timeout, extensionInfo })`
 *                                    invite another host to co-stream
 *   - `applicant`                    an incoming co-host request (if any)
 *   - `acceptHostConnection / rejectHostConnection({ liveId })`
 *   - `connected`                    hosts currently co-streaming with you
 *   - `exitHostConnection()`         end the co-host session
 *
 * Only the host uses this panel.
 */
import { onMounted } from 'vue';
import { useCoHostState, CoHostLayoutTemplate } from 'tuikit-atomicx-vue3';

const {
  candidates,
  applicant,
  connected,
  getCoHostCandidates,
  requestHostConnection,
  acceptHostConnection,
  rejectHostConnection,
  exitHostConnection,
} = useCoHostState();

onMounted(() => {
  // Empty cursor = first page of available co-host candidates.
  getCoHostCandidates('').catch((e) => console.warn('[co-host] candidates failed', e));
});

function invite(liveId: string) {
  requestHostConnection({
    liveId,
    layoutTemplate: CoHostLayoutTemplate.HostDynamicGrid,
    timeout: 30,
    extensionInfo: '',
  }).catch((e) => console.warn('[co-host] invite failed', e));
}
</script>

<template>
  <div class="cohost">
    <div class="cohost-header">Host PK / Raid</div>

    <!-- Incoming co-host request. -->
    <div v-if="applicant" class="row">
      <span>{{ applicant.userName || applicant.userId }} wants to PK</span>
      <span class="actions">
        <button class="primary" @click="acceptHostConnection({ liveId: applicant.liveId })">
          Accept
        </button>
        <button @click="rejectHostConnection({ liveId: applicant.liveId })">Decline</button>
      </span>
    </div>

    <!-- Currently connected hosts. -->
    <div v-if="connected.length" class="connected">
      <span>PK with: {{ connected.map((c) => c.userName || c.userId).join(', ') }}</span>
      <button @click="exitHostConnection()">End PK</button>
    </div>

    <!-- Candidate hosts to invite. -->
    <template v-else>
      <p v-if="candidates.length === 0" class="hint">No other live hosts to PK right now.</p>
      <div v-for="c in candidates" :key="c.liveId" class="row">
        <span>{{ c.userName || c.userId }}</span>
        <button class="primary" @click="invite(c.liveId)">Invite to PK</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.cohost {
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cohost-header {
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
}
</style>
