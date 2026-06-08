<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useLiveListState } from 'tuikit-atomicx-vue3';
import ChannelCard from '@/components/ChannelCard.vue';

const router = useRouter();
const { liveList, fetchLiveList } = useLiveListState();
const loading = ref(false);

const featured = computed(() => liveList.value[0] ?? null);

async function refresh() {
  loading.value = true;
  try {
    await fetchLiveList({ cursor: '', count: 50 });
  } catch (e) {
    console.warn('[browse] fetchLiveList failed', e);
  } finally {
    loading.value = false;
  }
}

function formatViewers(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return String(count);
}

function watchFeatured() {
  if (featured.value) router.push(`/watch/${featured.value.liveId}`);
}

onMounted(refresh);
</script>

<template>
  <div class="browse">
    <!-- Featured hero -->
    <section v-if="featured && !loading" class="hero">
      <div class="hero-bg" aria-hidden="true" />
      <div class="hero-content">
        <span class="badge-featured">Featured Live</span>
        <h2>{{ featured.liveName || featured.liveId }}</h2>
        <p class="hero-meta">
          {{ featured.liveOwner?.userName || featured.liveOwner?.userId }}
          · {{ formatViewers(featured.currentViewerCount) }} watching
        </p>
        <div class="hero-actions">
          <button class="primary" @click="watchFeatured">Watch Now</button>
          <button class="ghost hero-follow">Follow</button>
        </div>
      </div>
    </section>

    <section v-else-if="loading" class="hero hero-skeleton">
      <div class="skeleton skeleton-hero" />
    </section>

    <!-- Live Now -->
    <section class="live-section">
      <div class="section-head">
        <h2>Live Now</h2>
        <button class="see-all" :disabled="loading" @click="refresh">
          {{ loading ? 'Loading…' : 'See All →' }}
        </button>
      </div>

      <div v-if="loading" class="grid">
        <div v-for="n in 8" :key="n" class="skeleton-card">
          <div class="skeleton skeleton-thumb" />
          <div class="skeleton-meta">
            <div class="skeleton skeleton-avatar" />
            <div class="skeleton skeleton-line" />
          </div>
        </div>
      </div>

      <div v-else-if="liveList.length === 0" class="empty">
        <h3>No one is live right now</h3>
        <p>Be the first to go live on Kwitch.</p>
        <button class="kick" @click="router.push('/go-live')">Go Live</button>
      </div>

      <div v-else class="grid">
        <ChannelCard
          v-for="(live, i) in liveList"
          :key="live.liveId"
          :live="live"
          :show-pk="i % 3 === 1"
          @click="router.push(`/watch/${live.liveId}`)"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
.browse {
  max-width: 1400px;
  margin: 0 auto;
}

.hero {
  position: relative;
  border-radius: var(--radius-xl);
  overflow: hidden;
  margin-bottom: var(--space-6);
  min-height: 200px;
  border: 1px solid var(--border);
}

.hero-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #3d1f7a 0%, #9147ff 40%, #1a1a2e 100%);
}

.hero-content {
  position: relative;
  padding: var(--space-6) var(--space-8);
  max-width: 560px;
}

.hero-content h2 {
  margin: var(--space-3) 0 var(--space-2);
  font-size: var(--font-2xl);
  font-weight: 800;
  line-height: 1.2;
}

.hero-meta {
  margin: 0 0 var(--space-4);
  color: var(--text-dim);
  font-size: var(--font-sm);
}

.hero-actions {
  display: flex;
  gap: var(--space-2);
}

.hero-follow {
  border: 1px solid var(--border);
}

.hero-skeleton .skeleton-hero {
  height: 200px;
  border-radius: var(--radius-xl);
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.section-head h2 {
  margin: 0;
  font-size: var(--font-xl);
  font-weight: 700;
}

.see-all {
  background: transparent;
  color: var(--accent);
  font-weight: 600;
  padding: 4px 8px;
}

.see-all:hover:not(:disabled) {
  background: var(--accent-soft);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-5) var(--space-4);
}

.skeleton-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.skeleton-thumb {
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-lg);
}

.skeleton-meta {
  display: flex;
  gap: var(--space-3);
}

.skeleton-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
}

.skeleton-line {
  flex: 1;
  height: 14px;
  margin-top: 10px;
}

.empty {
  text-align: center;
  padding: var(--space-8);
  background: var(--bg-elev);
  border: 1px dashed var(--border);
  border-radius: var(--radius-xl);
}

.empty h3 {
  margin: 0 0 var(--space-2);
}

.empty p {
  margin: 0 0 var(--space-4);
  color: var(--text-dim);
}
</style>
