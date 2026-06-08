<script setup lang="ts">
/**
 * App shell. Responsibilities:
 *   - Render the dev-mode banner + top nav.
 *   - Gate the whole app behind a single login (AtomicXCore requires login
 *     before any other feature works). We auto-generate a random userId so a
 *     newcomer can click "Enter" and immediately be in — no signup flow.
 */
import { ref } from 'vue';
import { RouterView, useRouter } from 'vue-router';
import { loginToTrtc, session, randomUserId, trtcConfig } from '@/trtc';
import DevModeBanner from '@/components/DevModeBanner.vue';

const router = useRouter();
const userName = ref('');
const loggingIn = ref(false);
const error = ref('');

async function enter() {
  if (!userName.value.trim()) {
    error.value = 'Please enter a display name.';
    return;
  }
  loggingIn.value = true;
  error.value = '';
  try {
    // userId must be SDK-safe; userName is just the display label.
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

    <!-- Login gate: shown until TRTC login succeeds. -->
    <div v-if="!session.isLoggedIn" class="login-gate">
      <div class="login-card">
        <h1>🎥 TRTC Live</h1>
        <p class="subtitle">A Twitch/Kick-style demo on the TRTC Web Core SDK</p>
        <p class="appid">
          SDKAppID: <code>{{ trtcConfig.sdkAppId || '(not set)' }}</code> · mode:
          <code>{{ trtcConfig.userSigMode }}</code>
        </p>
        <input
          v-model="userName"
          placeholder="Pick a display name"
          @keyup.enter="enter"
        />
        <button class="primary" :disabled="loggingIn" @click="enter">
          {{ loggingIn ? 'Connecting…' : 'Enter' }}
        </button>
        <p v-if="error" class="error">{{ error }}</p>
      </div>
    </div>

    <!-- Authenticated app. -->
    <template v-else>
      <header class="top-nav">
        <nav>
          <a class="brand" @click="router.push('/')">🎥 TRTC Live</a>
          <a class="nav-link" @click="router.push('/')">Browse</a>
          <a class="nav-link" @click="router.push('/go-live')">Go Live</a>
        </nav>
        <span class="me">Signed in as <strong>{{ session.userName }}</strong></span>
      </header>
      <main class="app-main">
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
}
.login-card {
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 32px;
  width: 360px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: center;
}
.login-card h1 {
  margin: 0;
}
.subtitle {
  color: var(--text-dim);
  margin: 0;
}
.appid {
  font-size: 12px;
  color: var(--text-dim);
  margin: 0 0 8px;
}
.appid code,
.error code {
  background: var(--bg-elev-2);
  padding: 1px 5px;
  border-radius: 4px;
}
.error {
  color: #ff6b6b;
  font-size: 13px;
  word-break: break-word;
}
.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--bg-elev);
  border-bottom: 1px solid var(--border);
}
.top-nav nav {
  display: flex;
  align-items: center;
  gap: 20px;
}
.brand {
  font-weight: 800;
  cursor: pointer;
}
.nav-link {
  color: var(--text-dim);
  cursor: pointer;
}
.nav-link:hover {
  color: var(--text);
}
.me {
  font-size: 13px;
  color: var(--text-dim);
}
</style>
