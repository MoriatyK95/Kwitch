<script setup lang="ts">
/**
 * Watch (viewer) page.
 *
 * Lifecycle of watching, mapped to AtomicXCore:
 *   1. <LiveView/>  renders the audience video canvas (auto-plays the host).
 *   2. joinLive({ liveId })   on mount -> subscribe to the host's stream.
 *   3. leaveLive()            on unmount / when leaving.
 *   4. subscribeEvent(LiveListEvent.onLiveEnded / onKickedOutOfLive, ...)
 *      so we show a friendly message instead of a frozen black screen when
 *      the host ends the stream or we get removed.
 *
 * Viewers also get chat, gifts/likes, and can request to join as a guest star.
 */
import { onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { LiveView, useLiveListState, LiveListEvent } from 'tuikit-atomicx-vue3';
import LiveChat from '@/components/LiveChat.vue';
import ViewerList from '@/components/ViewerList.vue';
import GiftBar from '@/components/GiftBar.vue';
import CoGuestPanel from '@/components/CoGuestPanel.vue';

const props = defineProps<{ liveId: string }>();
const router = useRouter();

const { joinLive, leaveLive, subscribeEvent, unsubscribeEvent } = useLiveListState();

const status = ref<'joining' | 'watching' | 'ended' | 'kicked' | 'error'>('joining');
const errorMsg = ref('');

// --- Passive event handlers: the key to a graceful UX (no black screen). ---
function handleLiveEnded() {
  // Host stopped broadcasting. Tear down and tell the viewer.
  status.value = 'ended';
}
function handleKicked() {
  // A moderator/host removed this viewer from the room.
  status.value = 'kicked';
}

onMounted(async () => {
  subscribeEvent(LiveListEvent.onLiveEnded, handleLiveEnded);
  subscribeEvent(LiveListEvent.onKickedOutOfLive, handleKicked);
  try {
    await joinLive({ liveId: props.liveId });
    status.value = 'watching';
  } catch (e) {
    status.value = 'error';
    errorMsg.value = e instanceof Error ? e.message : String(e);
  }
});

onUnmounted(() => {
  // Always clean up: unsubscribe and leave the room so we don't leak a viewer.
  unsubscribeEvent(LiveListEvent.onLiveEnded, handleLiveEnded);
  unsubscribeEvent(LiveListEvent.onKickedOutOfLive, handleKicked);
  leaveLive().catch(() => {
    /* room may already be gone if it ended; ignore. */
  });
});

function backToBrowse() {
  router.push('/');
}
</script>

<template>
  <div class="watch">
    <div class="stage">
      <div class="video-wrap">
        <!-- Audience canvas; auto-plays the host's stream while watching. -->
        <LiveView v-show="status === 'watching'" />

        <!-- Friendly overlays for every non-watching state. -->
        <div v-if="status !== 'watching'" class="overlay">
          <template v-if="status === 'joining'">
            <p>Joining channel…</p>
          </template>
          <template v-else-if="status === 'ended'">
            <h3>📴 Stream ended</h3>
            <p>The host has finished broadcasting.</p>
            <button class="primary" @click="backToBrowse">Browse channels</button>
          </template>
          <template v-else-if="status === 'kicked'">
            <h3>🚪 You were removed</h3>
            <p>A moderator removed you from this channel.</p>
            <button class="primary" @click="backToBrowse">Browse channels</button>
          </template>
          <template v-else>
            <h3>⚠️ Couldn't join</h3>
            <p class="error">{{ errorMsg }}</p>
            <button class="primary" @click="backToBrowse">Browse channels</button>
          </template>
        </div>
      </div>

      <div v-if="status === 'watching'" class="under-video">
        <div class="channel-meta">
          <span class="badge-live">live</span>
          <strong>{{ props.liveId }}</strong>
        </div>
        <GiftBar />
        <CoGuestPanel :is-host="false" />
      </div>
    </div>

    <aside v-if="status === 'watching'" class="sidebar">
      <ViewerList />
      <LiveChat />
    </aside>
  </div>
</template>

<style scoped>
.watch {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 16px;
  height: 100%;
  min-height: 0;
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
.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  background: #000;
}
.overlay h3 {
  margin: 0;
}
.under-video {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.channel-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}
.error {
  color: #ff6b6b;
  font-size: 13px;
  word-break: break-word;
}
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}
</style>
