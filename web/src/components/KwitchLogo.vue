<script setup lang="ts">
defineProps<{
  showText?: boolean;
}>();
</script>

<template>
  <span class="logo">
    <svg class="logo-mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="kwitch-aurora" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#38e1ff" />
          <stop offset="100%" stop-color="#7c6cff" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#kwitch-aurora)" />
      <path d="M10 7h4v8.2L20.5 7H25l-7.2 9L25 25h-4.7L14 16.9V25h-4z" fill="#07090f" />
    </svg>
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
  flex-shrink: 0;
  filter: drop-shadow(0 2px 10px rgba(56, 225, 255, 0.35));
}

.logo-text {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 22px;
  letter-spacing: -0.03em;
  background: var(--brand-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
</style>
