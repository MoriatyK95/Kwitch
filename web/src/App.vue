<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import { initSession, session, randomUserId, livekitConfig } from '@/livekit';
import AppSidebar from '@/components/AppSidebar.vue';
import AppHeader from '@/components/AppHeader.vue';
import KwitchLogo from '@/components/KwitchLogo.vue';

const route = useRoute();
const userName = ref('');
const loggingIn = ref(false);
const error = ref('');

const isImmersivePage = computed(
  () => route.name === 'watch' || route.name === 'pk-arena',
);

const isFlushPage = computed(
  () => route.name === 'watch' || route.name === 'go-live' || route.name === 'pk-arena',
);

function enter() {
  if (!userName.value.trim()) {
    error.value = 'Please enter a display name.';
    return;
  }
  loggingIn.value = true;
  error.value = '';
  try {
    initSession(randomUserId(), userName.value.trim());
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    loggingIn.value = false;
  }
}
</script>

<template>
  <div class="app-shell">
    <div v-if="!session.isLoggedIn" class="login-gate">
      <div class="login-bg" aria-hidden="true" />
      <div class="login-card">
        <KwitchLogo />
        <h1>Welcome to Kwitch</h1>
        <p class="subtitle">Watch live streams or go live in seconds</p>

        <div class="login-form">
          <label for="display-name">Display name</label>
          <input
            id="display-name"
            v-model="userName"
            placeholder="Choose your username"
            @keyup.enter="enter"
          />
          <button class="brand enter-btn" :disabled="loggingIn" @click="enter">
            {{ loggingIn ? 'Connecting…' : 'Start watching' }}
          </button>
          <p v-if="error" class="error">{{ error }}</p>
        </div>

        <p class="appid">
          LiveKit <code>{{ livekitConfig.url || '(not set)' }}</code>
        </p>
      </div>
    </div>

    <template v-else>
      <template v-if="!isImmersivePage">
        <AppHeader />
        <div class="app-body">
          <AppSidebar />
          <main
            class="app-main"
            :class="isFlushPage ? 'app-main--flush' : 'app-main--padded'"
          >
            <RouterView />
          </main>
        </div>
      </template>
      <main v-else class="app-main app-main--immersive">
        <RouterView />
      </main>
    </template>
  </div>
</template>

<style scoped>
.login-gate {
  flex: 1;
  display: grid;
  place-items: center;
  position: relative;
}

.login-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 70% 55% at 25% 35%, rgba(56, 225, 255, 0.14), transparent 60%),
    radial-gradient(ellipse 55% 45% at 75% 65%, rgba(124, 108, 255, 0.16), transparent 55%),
    radial-gradient(ellipse 40% 30% at 50% 100%, rgba(255, 61, 110, 0.06), transparent 60%),
    var(--bg);
}

.login-card {
  position: relative;
  background: rgba(13, 17, 26, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  width: min(400px, calc(100vw - 32px));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  text-align: center;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.55);
}

.login-card h1 {
  margin: 0;
  font-size: var(--font-xl);
  font-weight: 700;
}

.subtitle {
  color: var(--text-dim);
  margin: 0;
}

.login-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  text-align: left;
}

.login-form label {
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--text-dim);
}

.login-form input {
  width: 100%;
  height: 44px;
}

.enter-btn {
  height: 44px;
  margin-top: var(--space-2);
}

.appid {
  font-size: 11px;
  color: var(--text-muted);
  margin: 0;
}

.appid code {
  background: var(--bg-elev-2);
  padding: 1px 5px;
  border-radius: 4px;
}

.error {
  color: var(--error);
  font-size: var(--font-sm);
  margin: 0;
}

.app-main--immersive {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>
