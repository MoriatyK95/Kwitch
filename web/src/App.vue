<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import { loginToTrtc, session, randomUserId, trtcConfig } from '@/trtc';
import DevModeBanner from '@/components/DevModeBanner.vue';
import AppSidebar from '@/components/AppSidebar.vue';
import AppHeader from '@/components/AppHeader.vue';
import KwitchLogo from '@/components/KwitchLogo.vue';

const route = useRoute();
const userName = ref('');
const loggingIn = ref(false);
const error = ref('');

const isStreamPage = computed(
  () => route.name === 'watch' || route.name === 'go-live',
);

async function enter() {
  if (!userName.value.trim()) {
    error.value = 'Please enter a display name.';
    return;
  }
  loggingIn.value = true;
  error.value = '';
  try {
    await loginToTrtc(randomUserId(), userName.value.trim());
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    loggingIn.value = false;
  }
}
</script>

<template>
  <div class="app-shell">
    <DevModeBanner />

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
          <button class="kick enter-btn" :disabled="loggingIn" @click="enter">
            {{ loggingIn ? 'Connecting…' : 'Log In' }}
          </button>
          <p v-if="error" class="error">{{ error }}</p>
        </div>

        <p class="appid">
          SDKAppID <code>{{ trtcConfig.sdkAppId || '(not set)' }}</code>
          · <code>{{ trtcConfig.userSigMode }}</code>
        </p>
      </div>
    </div>

    <template v-else>
      <AppHeader />
      <div class="app-body">
        <AppSidebar />
        <main
          class="app-main"
          :class="isStreamPage ? 'app-main--flush' : 'app-main--padded'"
        >
          <RouterView />
        </main>
      </div>
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
    radial-gradient(ellipse 70% 50% at 30% 40%, rgba(145, 70, 255, 0.2), transparent 60%),
    radial-gradient(ellipse 50% 40% at 70% 60%, rgba(83, 252, 24, 0.08), transparent 50%),
    var(--bg);
}

.login-card {
  position: relative;
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  width: min(400px, calc(100vw - 32px));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  text-align: center;
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
</style>
