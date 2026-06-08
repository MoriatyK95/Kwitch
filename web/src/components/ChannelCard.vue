<script setup lang="ts">
import type { LiveInfo } from 'tuikit-atomicx-vue3';

const props = defineProps<{
  live: LiveInfo;
  showPk?: boolean;
}>();

defineEmits<{
  click: [];
}>();

function formatViewers(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return String(count);
}

function hostInitial(): string {
  const name = props.live.liveOwner?.userName || props.live.liveOwner?.userId || '?';
  return name.charAt(0).toUpperCase();
}

function hostName(): string {
  return props.live.liveOwner?.userName || props.live.liveOwner?.userId || 'Unknown';
}
</script>

<template>
  <article class="card" @click="$emit('click')">
    <div
      class="thumb"
      :style="live.coverUrl ? { backgroundImage: `url(${live.coverUrl})` } : {}"
    >
      <span class="badge-live">Live</span>
      <span class="viewers">{{ formatViewers(live.currentViewerCount) }}</span>
      <span v-if="showPk" class="badge-pk pk-tag">PK Battle</span>
    </div>
    <div class="meta">
      <span class="avatar">{{ hostInitial() }}</span>
      <div class="meta-text">
        <h3 class="title">{{ live.liveName || live.liveId }}</h3>
        <p class="host">{{ hostName() }}</p>
      </div>
    </div>
  </article>
</template>

<style scoped>
.card {
  cursor: pointer;
  border-radius: var(--radius-lg);
  transition: transform var(--transition);
}

.card:hover {
  transform: translateY(-2px);
}

.card:hover .thumb {
  box-shadow: 0 0 0 2px var(--accent);
}

.thumb {
  position: relative;
  aspect-ratio: 16 / 9;
  background: linear-gradient(135deg, #2a1a4a 0%, #1a1a22 60%, #0d2818 100%);
  background-size: cover;
  background-position: center;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.thumb .badge-live {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
}

.viewers {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  background: rgba(0, 0, 0, 0.75);
  padding: 3px 8px;
  border-radius: 4px;
  font-size: var(--font-xs);
  font-weight: 700;
}

.pk-tag {
  position: absolute;
  bottom: var(--space-2);
  left: var(--space-2);
}

.meta {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-1);
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--accent-soft);
  border: 2px solid var(--accent);
  color: var(--accent);
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: var(--font-sm);
  flex-shrink: 0;
}

.meta-text {
  min-width: 0;
  flex: 1;
}

.title {
  margin: 0;
  font-size: var(--font-base);
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.host {
  margin: 2px 0 0;
  color: var(--text-dim);
  font-size: var(--font-sm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
