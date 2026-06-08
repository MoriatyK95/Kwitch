<script setup lang="ts">
/**
 * Viewer count + audience list.
 *
 * Powered by AtomicXCore's `useLiveAudienceState`:
 *   - `audienceCount`     reactive number of current viewers
 *   - `audienceList`      reactive array of audience members
 *   - `fetchAudienceList()` pulls the initial list (events keep it fresh after)
 */
import { onMounted } from 'vue';
import { useLiveAudienceState } from 'tuikit-atomicx-vue3';

const { audienceList, audienceCount, fetchAudienceList } = useLiveAudienceState();

onMounted(() => {
  // Prime the list once; the SDK updates audienceList/Count reactively as
  // people join and leave via its internal event subscriptions.
  fetchAudienceList().catch((e) => console.warn('[viewers] fetch failed', e));
});
</script>

<template>
  <div class="viewers">
    <div class="viewers-header">
      <span class="live-dot" />
      {{ audienceCount }} watching
    </div>
    <ul class="viewers-list">
      <li v-for="v in audienceList" :key="v.userId">
        {{ v.userName || v.userId }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.viewers {
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 10px 14px;
}
.viewers-header {
  font-weight: 700;
  font-size: 13px;
  margin-bottom: 8px;
}
.viewers-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 160px;
  overflow-y: auto;
  font-size: 13px;
  color: var(--text-dim);
}
.viewers-list li {
  padding: 3px 0;
}
</style>
