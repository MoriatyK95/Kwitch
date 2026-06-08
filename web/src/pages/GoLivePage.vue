<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { StreamMixer, useLiveListState } from 'tuikit-atomicx-vue3';
import { session } from '@/trtc';
import DeviceSelector from '@/components/DeviceSelector.vue';
import LiveChat from '@/components/LiveChat.vue';
import ViewerList from '@/components/ViewerList.vue';
import GiftBar from '@/components/GiftBar.vue';
import CoGuestPanel from '@/components/CoGuestPanel.vue';
import CoHostPanel from '@/components/CoHostPanel.vue';

const router = useRouter();
const { startLive, endLive } = useLiveListState();

const title = ref(`${session.userName}'s stream`);
const isLive = ref(false);
const busy = ref(false);
const error = ref('');
const liveId = `live_${session.userId}`;

async function goLive() {
  busy.value = true;
  error.value = '';
  try {
    await startLive({
      liveId,
      liveName: title.value.trim() || liveId,
      isGiftEnabled: true,
      isLikeEnabled: true,
    });
    isLive.value = true;
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    busy.value = false;
  }
}

async function stopLive() {
  busy.value = true;
  try {
    await endLive();
    isLive.value = false;
    router.push('/');
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="golive" :class="{ live: isLive }">
    <div class="stage">
      <header class="page-head">
        <div>
          <h1>{{ isLive ? 'You are live' : 'Go Live' }}</h1>
          <p>{{ isLive ? 'Manage your broadcast' : 'Set up and start streaming' }}</p>
        </div>
        <div v-if="isLive" class="live-badge">
          <span class="live-dot" />
          LIVE
        </div>
      </header>

      <div class="video-wrap">
        <StreamMixer />
        <span v-if="isLive" class="badge-live live-overlay">Live</span>
      </div>

      <div v-if="!isLive" class="setup panel">
        <div class="panel-header">Stream setup</div>
        <div class="setup-body">
          <DeviceSelector />
          <label class="title-field">
            Stream title
            <input v-model="title" placeholder="What are you streaming today?" />
          </label>
          <button class="kick start-btn" :disabled="busy" @click="goLive">
            {{ busy ? 'Starting…' : 'Start broadcast' }}
          </button>
          <p class="hint">Room ID: <code>{{ liveId }}</code></p>
        </div>
      </div>

      <div v-else class="live-controls">
        <div class="live-bar panel">
          <span><span class="live-dot" /> <strong>{{ title }}</strong></span>
          <button class="end-btn" :disabled="busy" @click="stopLive">
            {{ busy ? 'Ending…' : 'End broadcast' }}
          </button>
        </div>
        <GiftBar />
        <CoGuestPanel :is-host="true" />
        <CoHostPanel />
      </div>

      <p v-if="error" class="error">{{ error }}</p>
    </div>

    <aside v-if="isLive" class="sidebar">
      <ViewerList />
      <LiveChat />
    </aside>
  </div>
</template>

<style scoped>
.golive {
  display: grid;
  grid-template-columns: 1fr;
  height: 100%;
  min-height: 0;
}

.golive.live {
  grid-template-columns: 1fr var(--chat-width);
}

.stage {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-4);
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.page-head h1 {
  margin: 0;
  font-size: var(--font-xl);
  font-weight: 800;
}

.page-head p {
  margin: var(--space-1) 0 0;
  color: var(--text-dim);
  font-size: var(--font-sm);
}

.live-badge {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 6px 14px;
  border: 1px solid var(--live);
  border-radius: 999px;
  font-size: var(--font-xs);
  font-weight: 800;
  color: var(--live);
  background: rgba(235, 4, 0, 0.1);
}

.video-wrap {
  position: relative;
  background: #000;
  border-radius: var(--radius-lg);
  aspect-ratio: 16 / 9;
  overflow: hidden;
}

.video-wrap :deep(> *) {
  width: 100%;
  height: 100%;
}

.live-overlay {
  position: absolute;
  top: var(--space-3);
  left: var(--space-3);
}

.setup-body {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.title-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--text-dim);
}

.title-field input {
  height: 44px;
}

.start-btn {
  align-self: flex-start;
  padding: 10px 24px;
  font-size: var(--font-base);
}

.hint {
  margin: 0;
  font-size: var(--font-xs);
  color: var(--text-muted);
}

.hint code {
  background: var(--bg-elev-2);
  padding: 1px 5px;
  border-radius: 4px;
}

.live-controls {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.live-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
}

.end-btn {
  background: var(--live);
  color: #fff;
  font-weight: 700;
}

.end-btn:hover:not(:disabled) {
  background: #c90300;
}

.error {
  color: var(--error);
  font-size: var(--font-sm);
  margin: 0;
}

.sidebar {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-left: 1px solid var(--border);
  background: var(--bg-elev);
}

@media (max-width: 1024px) {
  .golive.live {
    grid-template-columns: 1fr;
  }

  .sidebar {
    border-left: none;
    border-top: 1px solid var(--border);
    max-height: 380px;
  }
}
</style>
