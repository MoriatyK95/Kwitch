<script setup lang="ts">
/**
 * Go Live (host) page.
 *
 * Lifecycle of a broadcast, mapped to AtomicXCore:
 *   1. <StreamMixer/>  renders the host's streaming/preview canvas.
 *   2. <DeviceSelector/> opens camera+mic (useDeviceState) — auto-previewed.
 *   3. startLive({ liveId, liveName, isGiftEnabled, isLikeEnabled })
 *      creates the room and begins broadcasting.
 *   4. endLive() stops the broadcast.
 *
 * While live, the host gets the same chat / viewers / gifts panels the
 * audience sees, plus host-only co-guest approvals and co-host PK controls.
 */
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

// A stable, SDK-safe room id derived from the host's userId. In a real product
// the backend would allocate this; here we keep it deterministic per host.
const liveId = `live_${session.userId}`;

async function goLive() {
  busy.value = true;
  error.value = '';
  try {
    // isGiftEnabled / isLikeEnabled turn on the engagement features so the
    // GiftBar component has something to talk to.
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
  <div class="golive">
    <div class="stage">
      <div class="video-wrap">
        <!-- Host streaming view; auto-previews the selected camera. -->
        <StreamMixer />
        <span v-if="isLive" class="badge-live live-overlay">live</span>
      </div>

      <!-- Pre-broadcast controls. -->
      <div v-if="!isLive" class="controls">
        <DeviceSelector />
        <div class="go-row">
          <input v-model="title" placeholder="Stream title" />
          <button class="primary" :disabled="busy" @click="goLive">
            {{ busy ? 'Starting…' : 'Start broadcast' }}
          </button>
        </div>
        <p class="hint">Room ID: <code>{{ liveId }}</code></p>
      </div>

      <!-- Live controls. -->
      <div v-else class="controls">
        <div class="go-row">
          <span><span class="live-dot" /> You are live — <strong>{{ title }}</strong></span>
          <button :disabled="busy" @click="stopLive">End broadcast</button>
        </div>
        <GiftBar />
        <CoGuestPanel :is-host="true" />
        <CoHostPanel />
      </div>

      <p v-if="error" class="error">{{ error }}</p>
    </div>

    <!-- Chat + viewers sidebar (only meaningful once live). -->
    <aside v-if="isLive" class="sidebar">
      <ViewerList />
      <LiveChat />
    </aside>
  </div>
</template>

<style scoped>
.golive {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 16px;
  height: 100%;
  min-height: 0;
}
.golive:has(.sidebar) {
  grid-template-columns: 1fr 320px;
}
.stage {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}
.video-wrap {
  position: relative;
  background: #000;
  border-radius: var(--radius);
  aspect-ratio: 16 / 9;
  overflow: hidden;
}
.video-wrap :deep(> *) {
  width: 100%;
  height: 100%;
}
.live-overlay {
  position: absolute;
  top: 12px;
  left: 12px;
}
.controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.go-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.go-row input {
  flex: 1;
}
.hint {
  font-size: 12px;
  color: var(--text-dim);
  margin: 0;
}
.hint code {
  background: var(--bg-elev-2);
  padding: 1px 5px;
  border-radius: 4px;
}
.error {
  color: #ff6b6b;
  font-size: 13px;
}
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}
</style>
