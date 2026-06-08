<script setup lang="ts">
import { onMounted } from 'vue';
import { useLiveAudienceState } from 'tuikit-atomicx-vue3';

const { audienceList, audienceCount, fetchAudienceList } = useLiveAudienceState();

onMounted(() => {
  fetchAudienceList().catch((e) => console.warn('[viewers] fetch failed', e));
});
</script>

<template>
  <div class="viewers">
    <div class="viewers-header">
      <span class="live-dot" />
      <span class="count">{{ audienceCount }}</span>
      <span class="label">viewers</span>
    </div>
    <ul class="viewers-list">
      <li v-if="audienceList.length === 0" class="empty">No viewers yet</li>
      <li v-for="v in audienceList" :key="v.userId" class="viewer-item">
        <span class="avatar">{{ (v.userName || v.userId).charAt(0).toUpperCase() }}</span>
        {{ v.userName || v.userId }}
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
  color: var(--kick);
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
