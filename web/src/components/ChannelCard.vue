<script setup lang="ts">
import type { StreamInfo } from '@/livekit';

defineProps<{
  live: StreamInfo;
  showPk?: boolean;
  thumbTint?: string;
}>();

defineEmits<{
  click: [];
}>();

const thumbTints = [
  '#10243a',
  '#1a1d3d',
  '#0f2e33',
  '#251a3d',
  '#132830',
  '#1c2040',
  '#0e2a3f',
  '#221c44',
];

function formatViewers(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return String(count);
}

function hostInitial(live: StreamInfo): string {
  const name = live.hostName || live.hostId || '?';
  return name.charAt(0).toUpperCase();
}

function hostName(live: StreamInfo): string {
  return live.hostName || live.hostId || 'Unknown';
}

function thumbBackground(live: StreamInfo, tint?: string): Record<string, string> {
  const idx =
    Math.abs((live.liveId || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)) %
    thumbTints.length;
  return { backgroundColor: tint || thumbTints[idx] };
}
</script>

<template>
  <article class="card" @click="$emit('click')">
    <div class="thumb" :style="thumbBackground(live, thumbTint)">
      <span class="badge-live">Live</span>
      <span class="viewers">{{ formatViewers(live.currentViewerCount) }}</span>
      <span v-if="showPk" class="badge-pk pk-tag">⚔️ PK BATTLE</span>
    </div>
    <div class="meta">
      <span class="avatar">{{ hostInitial(live) }}</span>
      <div class="meta-text">
        <h3 class="title">{{ live.liveName || live.liveId }}</h3>
        <p class="host">{{ hostName(live) }}</p>
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
  transition: transform var(--transition);
}

.card:hover {
  transform: translateY(-3px);
}

.thumb {
  position: relative;
  height: var(--thumb-height);
  background-size: cover;
  background-position: center;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border);
  transition: border-color var(--transition), box-shadow var(--transition);
}

.card:hover .thumb {
  border-color: var(--brand);
  box-shadow: var(--brand-glow);
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
  background: var(--brand-gradient);
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 700;
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
