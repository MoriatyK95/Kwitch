<script setup lang="ts">
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

function handleLiveEnded() {
  status.value = 'ended';
}
function handleKicked() {
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
  unsubscribeEvent(LiveListEvent.onLiveEnded, handleLiveEnded);
  unsubscribeEvent(LiveListEvent.onKickedOutOfLive, handleKicked);
  leaveLive().catch(() => {});
});

function backToBrowse() {
  router.push('/');
}
</script>

<template>
  <div class="watch">
    <div class="stage">
      <div class="video-wrap">
        <LiveView v-show="status === 'watching'" />

        <div v-if="status !== 'watching'" class="overlay">
          <template v-if="status === 'joining'">
            <div class="spinner" />
            <p>Connecting to channel…</p>
          </template>
          <template v-else-if="status === 'ended'">
            <h3>Stream ended</h3>
            <p>The host has finished broadcasting.</p>
            <button class="primary" @click="backToBrowse">Browse channels</button>
          </template>
          <template v-else-if="status === 'kicked'">
            <h3>You were removed</h3>
            <p>A moderator removed you from this channel.</p>
            <button class="primary" @click="backToBrowse">Browse channels</button>
          </template>
          <template v-else>
            <h3>Couldn't join</h3>
            <p class="error-text">{{ errorMsg }}</p>
            <button class="primary" @click="backToBrowse">Browse channels</button>
          </template>
        </div>
      </div>

      <div v-if="status === 'watching'" class="channel-bar">
        <div class="channel-info">
          <span class="channel-avatar">{{ liveId.charAt(0).toUpperCase() }}</span>
          <div>
            <div class="channel-title-row">
              <span class="badge-live">Live</span>
              <h2>{{ liveId }}</h2>
            </div>
            <p class="channel-sub">Just Chatting</p>
          </div>
        </div>
        <button class="follow-btn">Follow</button>
      </div>

      <div v-if="status === 'watching'" class="under-video">
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
  grid-template-columns: 1fr var(--chat-width);
  height: 100%;
  min-height: 0;
}

.stage {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-4);
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

.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  text-align: center;
  background: var(--bg-elev);
}

.overlay h3 {
  margin: 0;
}

.overlay p {
  margin: 0;
  color: var(--text-dim);
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-text {
  color: var(--error);
  font-size: var(--font-sm);
}

.channel-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.channel-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
}

.channel-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--accent);
  display: grid;
  place-items: center;
  font-weight: 800;
  flex-shrink: 0;
}

.channel-title-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.channel-title-row h2 {
  margin: 0;
  font-size: var(--font-lg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.channel-sub {
  margin: 2px 0 0;
  font-size: var(--font-sm);
  color: var(--text-dim);
}

.follow-btn {
  background: var(--accent);
  color: #fff;
  font-weight: 700;
  padding: 8px 20px;
  flex-shrink: 0;
}

.follow-btn:hover {
  background: var(--accent-hover);
}

.under-video {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.sidebar {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-left: 1px solid var(--border);
  background: var(--bg-elev);
}

@media (max-width: 1024px) {
  .watch {
    grid-template-columns: 1fr;
  }

  .sidebar {
    border-left: none;
    border-top: 1px solid var(--border);
    max-height: 380px;
  }
}
</style>
