<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useLiveListState } from 'tuikit-atomicx-vue3';

const route = useRoute();
const router = useRouter();
const { liveList, fetchLiveList } = useLiveListState();

const categories = [
  { label: 'Home', path: '/', icon: 'home' },
  { label: 'Gaming', path: '/', icon: 'gaming' },
  { label: 'IRL', path: '/', icon: 'irl' },
  { label: 'Music', path: '/', icon: 'music' },
  { label: 'Sports', path: '/', icon: 'sports' },
  { label: 'Creative', path: '/', icon: 'creative' },
  { label: 'PK Arena', path: '/go-live', icon: 'pk', accent: true },
];

const followed = computed(() =>
  liveList.value.slice(0, 5).map((live) => ({
    name: live.liveOwner?.userName || live.liveOwner?.userId || 'Unknown',
    live: true,
  })),
);

function isActive(path: string, label: string) {
  if (label === 'Home') return route.path === '/';
  if (path === '/go-live') return route.path === '/go-live';
  return false;
}

function navigate(path: string) {
  router.push(path);
}

onMounted(() => {
  fetchLiveList({ cursor: '', count: 10 }).catch(() => {});
});
</script>

<template>
  <aside class="sidebar">
    <nav class="cat-nav" aria-label="Categories">
      <button
        v-for="cat in categories"
        :key="cat.label"
        class="cat-item"
        :class="{ active: isActive(cat.path, cat.label), accent: cat.accent }"
        :title="cat.label"
        @click="navigate(cat.path)"
      >
        <span class="cat-icon" aria-hidden="true">
          <svg v-if="cat.icon === 'home'" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          <svg v-else-if="cat.icon === 'pk'" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M6.92 5H5l9 9 1-1.5L6.92 5zM17.5 3l-1.41 1.41L19.17 7.5 16.09 10.59 17.5 12l4-4-4-5zM3 17.5l4 4 1.41-1.41L7.5 19.17l3.09-3.09L9.17 14.5l-4 4z"
            />
          </svg>
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h10v2H4v-2z" />
          </svg>
        </span>
        <span class="cat-label">{{ cat.label }}</span>
      </button>
    </nav>

    <div class="followed">
      <h3 class="followed-title">Followed Channels</h3>
      <ul v-if="followed.length" class="followed-list">
        <li v-for="ch in followed" :key="ch.name" class="followed-item">
          <span class="followed-avatar">{{ ch.name.charAt(0).toUpperCase() }}</span>
          <span class="followed-name">{{ ch.name }}</span>
          <span v-if="ch.live" class="live-dot" />
        </li>
      </ul>
      <p v-else class="followed-empty">No live followed channels</p>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-elev);
  border-right: 1px solid var(--border);
  padding: var(--space-3) 0;
  min-height: 0;
  overflow-y: auto;
}

.cat-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 var(--space-2);
}

.cat-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 10px var(--space-3);
  background: transparent;
  color: var(--text-dim);
  font-weight: 600;
  width: 100%;
  text-align: left;
  border-radius: var(--radius);
}

.cat-item:hover {
  background: var(--bg-hover);
  color: var(--text);
}

.cat-item.active {
  background: var(--accent-soft);
  color: var(--accent);
}

.cat-item.accent {
  color: var(--kick);
}

.cat-item.accent:hover {
  color: var(--kick-hover);
}

.cat-icon {
  display: flex;
  width: 20px;
  flex-shrink: 0;
}

.followed {
  margin-top: var(--space-5);
  padding: 0 var(--space-4);
}

.followed-title {
  margin: 0 0 var(--space-3);
  font-size: var(--font-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.followed-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.followed-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 6px 0;
  font-size: var(--font-sm);
}

.followed-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent);
  display: grid;
  place-items: center;
  font-size: var(--font-xs);
  font-weight: 700;
  flex-shrink: 0;
}

.followed-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-dim);
}

.followed-empty {
  margin: 0;
  font-size: var(--font-sm);
  color: var(--text-muted);
}

@media (max-width: 1024px) {
  .cat-label,
  .followed {
    display: none;
  }

  .cat-item {
    justify-content: center;
    padding: 10px;
  }
}
</style>
