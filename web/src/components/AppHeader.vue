<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { session } from '@/trtc';
import KwitchLogo from '@/components/KwitchLogo.vue';

defineProps<{
  flush?: boolean;
}>();

const route = useRoute();
const router = useRouter();
const searchQuery = ref('');

const topNav = [
  { label: 'Browse', path: '/' },
  { label: 'Following', path: '/' },
  { label: 'Categories', path: '/' },
  { label: 'PK Arena', path: '/go-live', accent: true },
];

function isActive(item: (typeof topNav)[0]) {
  if (item.label === 'Browse') return route.path === '/';
  if (item.path === '/go-live') return route.path === '/go-live';
  return false;
}

function navigate(path: string) {
  router.push(path);
}

function avatarInitial(): string {
  return (session.userName || '?').charAt(0).toUpperCase();
}
</script>

<template>
  <header class="header" :class="{ flush }">
    <button class="brand" @click="navigate('/')">
      <KwitchLogo />
    </button>

    <nav class="top-nav" aria-label="Main">
      <button
        v-for="item in topNav"
        :key="item.label"
        class="top-nav-item"
        :class="{ active: isActive(item), accent: item.accent }"
        @click="navigate(item.path)"
      >
        {{ item.label }}
      </button>
    </nav>

    <form class="search" @submit.prevent>
      <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path
          d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
        />
      </svg>
      <input v-model="searchQuery" type="search" placeholder="Search streams, creators..." />
    </form>

    <div class="actions">
      <button class="kick go-live" @click="navigate('/go-live')">Go Live</button>
      <span class="avatar" :title="session.userName">{{ avatarInitial() }}</span>
    </div>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  height: var(--header-height);
  padding: 0 var(--space-5);
  background: var(--bg-elev);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.header.flush {
  padding: 0 var(--space-4);
}

.brand {
  background: transparent;
  padding: 0;
  flex-shrink: 0;
}

.brand:hover {
  background: transparent;
  opacity: 0.9;
}

.top-nav {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex-shrink: 0;
}

.top-nav-item {
  background: transparent;
  color: var(--text-dim);
  font-weight: 600;
  padding: 8px 12px;
  border-radius: var(--radius);
  position: relative;
}

.top-nav-item:hover {
  color: var(--text);
  background: var(--bg-hover);
}

.top-nav-item.active {
  color: var(--text);
}

.top-nav-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 12px;
  right: 12px;
  height: 2px;
  background: var(--accent);
  border-radius: 2px 2px 0 0;
}

.top-nav-item.accent {
  color: var(--kick);
}

.top-nav-item.accent:hover {
  color: var(--kick-hover);
}

.search {
  flex: 1;
  max-width: 420px;
  position: relative;
  min-width: 120px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

.search input {
  width: 100%;
  height: 36px;
  padding-left: 38px;
  background: var(--bg);
  border-color: var(--border-subtle);
}

.actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-shrink: 0;
}

.go-live {
  padding: 8px 18px;
  white-space: nowrap;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--accent);
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: var(--font-sm);
  color: #fff;
  flex-shrink: 0;
}

@media (max-width: 1100px) {
  .top-nav {
    display: none;
  }
}

@media (max-width: 640px) {
  .search {
    display: none;
  }
}
</style>
