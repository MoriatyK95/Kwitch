<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStreamList, session, roomNameForHost, type StreamInfo } from '@/livekit';

const router = useRouter();
const { streams, refresh } = useStreamList();

const myRoom = roomNameForHost(session.userId);

onMounted(refresh);

function invite(live: StreamInfo) {
  router.push(`/watch/${live.liveId}`);
}
</script>

<template>
  <div class="cohost panel">
    <div class="panel-header">
      <span class="pk-title">Host PK / Raid</span>
    </div>
    <div class="body">
      <p class="hint">Invite another live host to co-stream (opens their channel).</p>
      <p v-if="streams.filter((s) => s.liveId !== myRoom).length === 0" class="hint">
        No other live hosts to PK right now.
      </p>
      <div
        v-for="c in streams.filter((s) => s.liveId !== myRoom)"
        :key="c.liveId"
        class="row"
      >
        <span>{{ c.hostName || c.hostId }}</span>
        <button class="brand invite-btn" @click="invite(c)">Watch / Raid</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pk-title {
  color: var(--brand);
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

.invite-btn {
  font-size: var(--font-xs);
  padding: 6px 12px;
}
</style>
