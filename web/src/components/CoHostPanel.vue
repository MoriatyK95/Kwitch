<script setup lang="ts">
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
  <div class="cohost panel">
    <div class="panel-header">
      <span class="pk-title">Host PK / Raid</span>
    </div>
    <div class="body">
      <div v-if="applicant" class="row incoming">
        <span>{{ applicant.userName || applicant.userId }} wants to PK</span>
        <span class="actions">
          <button class="primary" @click="acceptHostConnection({ liveId: applicant.liveId })">Accept</button>
          <button @click="rejectHostConnection({ liveId: applicant.liveId })">Decline</button>
        </span>
      </div>

      <div v-if="connected.length" class="connected-row">
        <span><span class="badge-pk">PK</span> {{ connected.map((c) => c.userName || c.userId).join(', ') }}</span>
        <button @click="exitHostConnection()">End PK</button>
      </div>

      <template v-else-if="!applicant">
        <p v-if="candidates.length === 0" class="hint">No other live hosts to PK right now.</p>
        <div v-for="c in candidates" :key="c.liveId" class="row">
          <span>{{ c.userName || c.userId }}</span>
          <button class="kick invite-btn" @click="invite(c.liveId)">Invite to PK</button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.pk-title {
  color: var(--kick);
}

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

.row.incoming {
  padding: var(--space-2);
  background: var(--accent-soft);
  border-radius: var(--radius);
}

.actions {
  display: flex;
  gap: 6px;
}

.connected-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-2);
  background: var(--kick-soft);
  border-radius: var(--radius);
  font-size: var(--font-sm);
}

.invite-btn {
  font-size: var(--font-xs);
  padding: 6px 12px;
}
</style>
