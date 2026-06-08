<script setup lang="ts">
/**
 * Browse / discovery page — a grid of currently-live channels.
 *
 * Powered by AtomicXCore's `useLiveListState`:
 *   - `fetchLiveList({ cursor, count })`  query the live room list
 *   - `liveList`                          reactive array of LiveInfo
 *
 * Click a card to navigate to /watch/:liveId.
 */
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useLiveListState } from 'tuikit-atomicx-vue3';

const router = useRouter();
const { liveList, fetchLiveList } = useLiveListState();
const loading = ref(false);

async function refresh() {
  loading.value = true;
  try {
    // Empty cursor = first page. count caps how many rooms we pull.
    await fetchLiveList({ cursor: '', count: 50 });
  } catch (e) {
    console.warn('[browse] fetchLiveList failed', e);
  } finally {
    loading.value = false;
  }
}

onMounted(refresh);
</script>

<template>
  <div class="browse">
    <div class="browse-head">
      <h2>Live channels</h2>
      <div class="head-actions">
        <button :disabled="loading" @click="refresh">
          {{ loading ? 'Refreshing…' : 'Refresh' }}
        </button>
        <button class="primary" @click="router.push('/go-live')">Go Live</button>
      </div>
    </div>

    <p v-if="!loading && liveList.length === 0" class="empty">
      No one is live right now. Be the first — hit <strong>Go Live</strong>!
    </p>

    <div class="grid">
      <div
        v-for="live in liveList"
        :key="live.liveId"
        class="card"
        @click="router.push(`/watch/${live.liveId}`)"
      >
        <div class="thumb" :style="live.coverUrl ? { backgroundImage: `url(${live.coverUrl})` } : {}">
          <span class="badge-live">live</span>
          <span class="viewers">{{ live.currentViewerCount }} 👁</span>
        </div>
        <div class="meta">
          <div class="title">{{ live.liveName || live.liveId }}</div>
          <div class="host">{{ live.liveOwner?.userName || live.liveOwner?.userId }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.browse-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.browse-head h2 {
  margin: 0;
}
.head-actions {
  display: flex;
  gap: 8px;
}
.empty {
  color: var(--text-dim);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}
.card {
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.12s ease;
}
.card:hover {
  transform: translateY(-2px);
  border-color: var(--accent);
}
.thumb {
  position: relative;
  aspect-ratio: 16 / 9;
  background: linear-gradient(135deg, #2a2a3a, #1a1a22);
  background-size: cover;
  background-position: center;
}
.thumb .badge-live {
  position: absolute;
  top: 8px;
  left: 8px;
}
.thumb .viewers {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.6);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}
.meta {
  padding: 10px 12px;
}
.title {
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.host {
  color: var(--text-dim);
  font-size: 13px;
}
</style>
