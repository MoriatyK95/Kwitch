<script setup lang="ts">
import type { LiveInfo } from 'tuikit-atomicx-vue3';

const props = defineProps<{
  live: LiveInfo;
  showPk?: boolean;
  thumbTint?: string;
}>();

defineEmits<{
  click: [];
}>();

const thumbTints = [
  '#33261a',
  '#1a2640',
  '#261a26',
  '#331f14',
  '#401a26',
  '#1f1a33',
  '#142e1f',
  '#2e1f38',
];

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

function thumbBackground(): Record<string, string> {
  if (props.live.coverUrl) {
    return { backgroundImage: `url(${props.live.coverUrl})` };
  }
  const idx =
    Math.abs((props.live.liveId || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)) %
    thumbTints.length;
  return { backgroundColor: props.thumbTint || thumbTints[idx] };
}
</script>

<template>
  <article class="card" @click="$emit('click')">
    <div class="thumb" :style="thumbBackground()">
      <span class="badge-live">Live</span>
      <span class="viewers">{{ formatViewers(live.currentViewerCount) }}</span>
      <span v-if="showPk" class="badge-pk pk-tag">⚔️ PK BATTLE</span>
    </div>
    <div class="meta">
      <span class="avatar">{{ hostInitial() }}</span>
      <div class="meta-text">
        <h3 class="title">{{ live.liveName || live.liveId }}</h3>
        <p class="host">{{ hostName() }}</p>
        <p class="category">{{ showPk ? 'PK Arena' : 'Just Chatting' }}</p>
      </div>
    </div>
  </article>
</template>

<style scoped>
.card {
  width: var(--card-width);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.thumb {
  position: relative;
  height: var(--thumb-height);
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
  background: rgba(0, 0, 0, 0.7);
  padding: 3px 6px;
  border-radius: 4px;
  font-size: var(--font-xs);
  font-weight: 500;
  color: var(--text);
}

.pk-tag {
  position: absolute;
  bottom: var(--space-2);
  left: var(--space-2);
}

.meta {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 600;
  font-size: var(--font-sm);
  flex-shrink: 0;
}

.meta-text {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.title {
  margin: 0;
  font-size: var(--font-base);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.host {
  margin: 0;
  color: var(--text-dim);
  font-size: var(--font-sm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category {
  margin: 0;
  color: var(--text-muted);
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
