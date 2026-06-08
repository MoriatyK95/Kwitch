<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const categories = [
  { label: 'Home', path: '/', emoji: '🏠' },
  { label: 'Gaming', path: '/', emoji: '🎮' },
  { label: 'IRL', path: '/', emoji: '📹' },
  { label: 'Music', path: '/', emoji: '🎵' },
  { label: 'Sports', path: '/', emoji: '⚽' },
  { label: 'Creative', path: '/', emoji: '🎨' },
  { label: 'PK Arena', path: '/pk-arena', emoji: '⚔️', accent: true },
];

const followedChannels = [
  { name: 'NinjaK', game: 'Fortnite', live: true },
  { name: 'LunaStream', game: 'Valorant', live: true },
  { name: 'ChefMike', game: 'Offline', live: false },
];

function isActive(label: string) {
  if (label === 'Home') return route.path === '/';
  if (label === 'PK Arena') return route.path === '/pk-arena';
  return false;
}

function navigate(path: string) {
  router.push(path);
}
</script>

<template>
  <aside class="sidebar">
    <nav class="cat-nav" aria-label="Categories">
      <button
        v-for="cat in categories"
        :key="cat.label"
        class="cat-item"
        :class="{ active: isActive(cat.label), accent: cat.accent }"
        @click="navigate(cat.path)"
      >
        <span class="cat-emoji" aria-hidden="true">{{ cat.emoji }}</span>
        <span class="cat-label">{{ cat.label }}</span>
      </button>
    </nav>

    <div class="divider" />

    <div class="followed">
      <h3 class="followed-title">Followed Channels</h3>
      <ul class="followed-list">
        <li v-for="ch in followedChannels" :key="ch.name" class="followed-item">
          <span class="followed-avatar" :class="{ offline: !ch.live }">
            {{ ch.name.charAt(0) }}
          </span>
          <div class="followed-text">
            <span class="followed-name">{{ ch.name }}</span>
            <span class="followed-game" :class="{ offline: !ch.live }">{{ ch.game }}</span>
          </div>
          <span v-if="ch.live" class="live-dot" />
        </li>
      </ul>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  background: var(--bg-elev);
  border-right: 1px solid var(--border);
  padding: var(--space-4) var(--space-3);
  min-height: 0;
  overflow-y: auto;
}

.cat-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.cat-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: 40px;
  padding: 0 var(--space-3);
  background: transparent;
  color: var(--text-dim);
  font-weight: 400;
  font-size: var(--font-base);
  width: 100%;
  text-align: left;
  border-radius: var(--radius-lg);
}

.cat-item:hover {
  background: var(--bg-hover);
  color: var(--text);
}

.cat-item.active {
  background: var(--bg-elev-2);
  color: var(--text);
  font-weight: 600;
}

.cat-item.accent .cat-label {
  color: var(--kick);
}

.cat-emoji {
  font-size: 16px;
  width: 16px;
  text-align: center;
  flex-shrink: 0;
}

.divider {
  height: 1px;
  background: var(--border);
  margin: var(--space-2) 0;
}

.followed-title {
  margin: 0 0 var(--space-2);
  padding: 0 var(--space-2);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.55px;
  color: var(--text-muted);
}

.followed-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.followed-item {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 44px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-lg);
}

.followed-item:hover {
  background: var(--bg-hover);
}

.followed-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.followed-avatar.offline {
  background: var(--bg-hover);
  color: var(--text-muted);
}

.followed-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.followed-name {
  font-size: var(--font-sm);
  font-weight: 500;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.followed-game {
  font-size: 11px;
  color: var(--text-dim);
}

.followed-game.offline {
  color: var(--text-muted);
}

@media (max-width: 1024px) {
  .cat-label,
  .followed {
    display: none;
  }

  .cat-item {
    justify-content: center;
    padding: 0;
  }

  .divider {
    display: none;
  }
}
</style>
