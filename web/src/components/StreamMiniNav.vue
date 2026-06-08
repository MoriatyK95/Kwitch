<script setup lang="ts">
import { useRouter } from 'vue-router';

defineEmits<{
  back: [];
}>();

const router = useRouter();

function goBack() {
  router.push('/');
}
</script>

<template>
  <header class="mini-nav">
    <div class="left">
      <button class="back-btn" @click="goBack">← Back</button>
      <button class="brand" @click="router.push('/')">Kwitch</button>
    </div>
    <div class="right">
      <button class="link-btn">Share</button>
      <button class="link-btn muted">Report</button>
    </div>
  </header>
</template>

<style scoped>
.mini-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 var(--space-4);
  background: var(--bg-elev);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.left,
.right {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.back-btn,
.brand,
.link-btn {
  background: transparent;
  padding: 0;
  font-size: var(--font-base);
}

.back-btn {
  color: var(--text-dim);
  font-weight: 500;
}

.back-btn:hover {
  background: transparent;
  color: var(--text);
}

.brand {
  color: var(--accent);
  font-weight: 700;
  font-size: var(--font-lg);
}

.brand:hover {
  background: transparent;
  opacity: 0.9;
}

.link-btn {
  color: var(--text-dim);
  font-weight: 500;
  font-size: 13px;
}

.link-btn.muted {
  color: var(--text-muted);
}

.link-btn:hover {
  background: transparent;
  color: var(--text);
}
</style>
