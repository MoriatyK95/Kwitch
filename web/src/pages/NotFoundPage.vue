<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<template>
  <div class="not-found">
    <p class="code">404</p>
    <h1>This channel drifted off the air</h1>
    <p class="hint">The page you're looking for doesn't exist or has moved.</p>
    <button class="brand" @click="router.push('/')">Back to Browse</button>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  min-height: 60vh;
  text-align: center;
}

.code {
  margin: 0;
  font-family: var(--font-display);
  font-size: 72px;
  font-weight: 700;
  line-height: 1;
  background: var(--brand-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

h1 {
  margin: 0;
  font-size: var(--font-xl);
}

.hint {
  margin: 0 0 var(--space-3);
  color: var(--text-dim);
}
</style>
