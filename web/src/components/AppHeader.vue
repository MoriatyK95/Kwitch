<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { session } from '@/livekit';
import KwitchLogo from '@/components/KwitchLogo.vue';

const route = useRoute();
const router = useRouter();
const searchQuery = ref('');

const topNav = [
  { label: 'Browse', path: '/' },
  { label: 'Following', path: '/' },
  { label: 'Categories', path: '/' },
  { label: 'PK Arena', path: '/pk-arena' },
];

function isActive(item: (typeof topNav)[0]) {
  if (item.label === 'Browse') return route.path === '/';
  if (item.label === 'PK Arena') return route.path === '/pk-arena';
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
  <header class="header">
    <button class="brand" @click="navigate('/')">
      <KwitchLogo />
    </button>

    <nav class="top-nav" aria-label="Main">
      <button
        v-for="item in topNav"
        :key="item.label"
        class="top-nav-item"
        :class="{ active: isActive(item) }"
        @click="navigate(item.path)"
      >
        {{ item.label }}
      </button>
    </nav>

    <div class="search">
      <input v-model="searchQuery" type="search" placeholder="Search streams, creators..." />
    </div>

    <div class="actions">
      <button class="brand go-live" @click="navigate('/go-live')">Go Live</button>
      <span class="user-label">{{ session.userName }}</span>
      <span class="avatar" :title="session.userName">{{ avatarInitial() }}</span>
    </div>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  height: var(--header-height);
  padding: 0 var(--space-6);
  background: var(--bg-elev);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.brand {
  background: transparent;
  padding: 0;
  flex-shrink: 0;
}

.brand:hover {
  background: transparent;
  opacity: 0.92;
}

.top-nav {
  display: flex;
  align-items: center;
  gap: 32px;
  flex-shrink: 0;
}

.top-nav-item {
  position: relative;
  background: transparent;
  color: var(--text-dim);
  font-weight: 500;
  font-size: var(--font-base);
  padding: 0 0 2px;
  border-radius: 0;
}

.top-nav-item:hover {
  color: var(--text);
  background: transparent;
}

.top-nav-item.active {
  color: var(--brand);
  font-weight: 600;
}

.top-nav-item.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -4px;
  height: 2px;
  border-radius: 2px;
  background: var(--brand-gradient);
}

.search {
  flex: 1;
  max-width: 320px;
  min-width: 160px;
}

.search input {
  width: 100%;
  height: 36px;
  background: var(--bg-elev-2);
  border: none;
  color: var(--text);
}

.actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-shrink: 0;
}

.go-live {
  padding: 8px 16px;
  white-space: nowrap;
}

.user-label {
  font-size: var(--font-sm);
  color: var(--text-dim);
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--brand-gradient);
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: var(--font-sm);
  color: #fff;
  flex-shrink: 0;
}

@media (max-width: 1100px) {
  .top-nav,
  .user-label {
    display: none;
  }
}

@media (max-width: 640px) {
  .search {
    display: none;
  }
}
</style>
