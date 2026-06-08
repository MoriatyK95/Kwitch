<script setup lang="ts">
defineProps<{
  showText?: boolean;
}>();
</script>

<template>
  <span class="logo">
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
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  background: var(--accent);
  color: var(--text);
  font-weight: 700;
  font-size: 18px;
  border-radius: var(--radius-lg);
  flex-shrink: 0;
}

.logo-text {
  font-weight: 700;
  font-size: 22px;
  letter-spacing: -0.02em;
  color: var(--text);
}
</style>
