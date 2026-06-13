<script setup lang="ts">
import { ref, shallowRef, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import type { Room } from 'livekit-client';
import {
  session,
  roomNameForHost,
  provideLiveKitRoom,
  useLiveKitRoom,
  livekitConfig,
} from '@/livekit';
import DeviceSelector from '@/components/DeviceSelector.vue';
import LiveChat from '@/components/LiveChat.vue';
import ViewerList from '@/components/ViewerList.vue';
import GiftBar from '@/components/GiftBar.vue';
import CoGuestPanel from '@/components/CoGuestPanel.vue';
import CoHostPanel from '@/components/CoHostPanel.vue';

const router = useRouter();
const roomRef = shallowRef<Room | null>(null);
provideLiveKitRoom(roomRef);

const { connect, disconnect, attachLocalVideo, error: roomError } = useLiveKitRoom(roomRef);

const title = ref(`${session.userName}'s stream`);
const isLive = ref(false);
const busy = ref(false);
const error = ref('');
const liveId = roomNameForHost(session.userId);
const videoEl = ref<HTMLVideoElement | null>(null);
const cameraId = ref<string>();
const micId = ref<string>();

async function updateRoomMetadata(): Promise<void> {
  const base = livekitConfig.tokenServerUrl.replace(/\/$/, '');
  const url = base ? `${base}/room-metadata` : '/room-metadata';
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomName: liveId,
      title: title.value.trim() || liveId,
      hostId: session.userId,
      hostName: session.userName,
    }),
  }).catch(() => {});
}

async function goLive() {
  busy.value = true;
  error.value = '';
  try {
    await connect(session.userId, session.userName, liveId, 'host', {
      cameraId: cameraId.value,
      micId: micId.value,
    });
    await updateRoomMetadata();
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
    await disconnect();
    isLive.value = false;
    router.push('/');
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    busy.value = false;
  }
}

watch([videoEl, isLive], () => {
  if (isLive.value && videoEl.value) {
    attachLocalVideo(videoEl.value);
  }
});

onMounted(() => {
  if (isLive.value && videoEl.value) {
    attachLocalVideo(videoEl.value);
  }
});
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
        <div class="mixer-host">
          <video ref="videoEl" autoplay playsinline muted class="preview-video" />
        </div>
        <span v-if="isLive" class="badge-live live-overlay">Live</span>
      </div>

      <div v-if="!isLive" class="setup panel">
        <div class="panel-header">Stream setup</div>
        <div class="setup-body">
          <DeviceSelector @devices-changed="(c, m) => { cameraId = c; micId = m; }" />
          <label class="title-field">
            Stream title
            <input v-model="title" placeholder="What are you streaming today?" />
          </label>
          <button class="brand start-btn" :disabled="busy" @click="goLive">
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

      <p v-if="error || roomError" class="error">{{ error || roomError }}</p>
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
  border-radius: var(--radius-pill);
  font-size: var(--font-xs);
  font-weight: 800;
  color: var(--live);
  background: var(--live-soft);
}

.video-wrap {
  position: relative;
  background: #000;
  border-radius: var(--radius-lg);
  aspect-ratio: 16 / 9;
  overflow: hidden;
}

.mixer-host {
  position: absolute;
  inset: 0;
}

.preview-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
  background: #e62e5d;
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
