<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStreamList } from '@/livekit';
import ChannelCard from '@/components/ChannelCard.vue';

const router = useRouter();
const { streams, loading, refresh } = useStreamList();

const featured = computed(() => streams.value[0] ?? null);

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
    <section v-if="featured && !loading" class="hero">
      <div class="hero-overlay" aria-hidden="true" />
      <div class="hero-content">
        <span class="badge-featured">Featured Live</span>
        <h2>{{ featured.liveName || featured.liveId }}</h2>
        <p class="hero-meta">
          {{ featured.hostName || featured.hostId }}
          · {{ formatViewers(featured.currentViewerCount) }} watching
        </p>
        <div class="hero-actions">
          <button class="primary watch-btn" @click="watchFeatured">Watch Now</button>
          <button class="ghost follow-btn">Follow Both</button>
        </div>
      </div>
    </section>

    <section v-else-if="loading" class="hero hero-skeleton">
      <div class="skeleton skeleton-hero" />
    </section>

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
        </div>
      </div>

      <div v-else-if="streams.length === 0" class="empty">
        <h3>No one is live right now</h3>
        <p>Be the first to go live on Kwitch.</p>
        <button class="brand" @click="router.push('/go-live')">Go Live</button>
      </div>

      <div v-else class="grid">
        <ChannelCard
          v-for="(live, i) in streams"
          :key="live.liveId"
          :live="live"
          :show-pk="i % 4 === 0"
          @click="router.push(`/watch/${live.liveId}`)"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
.browse {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: 1152px;
}

.hero {
  position: relative;
  height: 320px;
  border-radius: var(--radius-xl);
  overflow: hidden;
  background: var(--hero-bg);
  border: 1px solid var(--border-strong);
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 80% at 15% 20%, rgba(56, 225, 255, 0.18), transparent 60%),
    radial-gradient(ellipse 50% 70% at 85% 80%, rgba(124, 108, 255, 0.22), transparent 60%),
    radial-gradient(ellipse 30% 40% at 60% 10%, rgba(255, 61, 110, 0.08), transparent 60%);
  border-radius: var(--radius-xl);
}

.hero-content {
  position: relative;
  padding: 48px var(--space-8) var(--space-6);
  max-width: 680px;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.hero-content h2 {
  margin: 0;
  font-size: var(--font-2xl);
  font-weight: 700;
  line-height: 1.2;
}

.hero-meta {
  margin: 0;
  color: var(--text-dim);
  font-size: var(--font-lg);
}

.hero-actions {
  display: flex;
  gap: var(--space-3);
  padding-top: var(--space-2);
}

.watch-btn {
  padding: 12px 24px;
  font-size: var(--font-base);
  font-weight: 600;
}

.follow-btn {
  padding: 12px 24px;
  font-size: var(--font-base);
  font-weight: 500;
}

.hero-skeleton .skeleton-hero {
  height: 320px;
  border-radius: var(--radius-xl);
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-head h2 {
  margin: 0;
  font-size: var(--font-xl);
  font-weight: 700;
}

.see-all {
  background: transparent;
  color: var(--brand);
  font-weight: 500;
  font-size: var(--font-base);
  padding: 0;
}

.see-all:hover:not(:disabled) {
  background: transparent;
  opacity: 0.85;
}

.grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.skeleton-card {
  width: var(--card-width);
}

.skeleton-thumb {
  height: var(--thumb-height);
  border-radius: var(--radius-lg);
}

.empty {
  text-align: center;
  padding: var(--space-8);
  background: var(--bg-elev);
  border: 1px dashed var(--border);
  border-radius: var(--radius-xl);
  width: 100%;
}

.empty h3 {
  margin: 0 0 var(--space-2);
}

.empty p {
  margin: 0 0 var(--space-4);
  color: var(--text-dim);
}
</style>
