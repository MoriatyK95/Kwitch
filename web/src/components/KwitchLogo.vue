<script setup lang="ts">
defineProps<{
  showText?: boolean;
  size?: 'sm' | 'md';
}>();
</script>

<template>
  <span class="logo" :class="[size || 'md', { 'logo--text': showText !== false }]">
    <span class="logo-mark" aria-hidden="true">K</span>
    <span v-if="showText !== false" class="logo-text">Kwitch</span>
  </span>
</template>

<style scoped>
.logo {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.logo-mark {
  display: grid;
  place-items: center;
  background: var(--accent);
  color: #fff;
  font-weight: 800;
  border-radius: 6px;
  flex-shrink: 0;
}

.logo--text .logo-mark {
  width: 32px;
  height: 32px;
  font-size: 16px;
}

.logo.sm .logo-mark {
  width: 28px;
  height: 28px;
  font-size: 14px;
}

.logo-text {
  font-weight: 800;
  font-size: var(--font-lg);
  letter-spacing: -0.02em;
  color: var(--text);
}
</style>
