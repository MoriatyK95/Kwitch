<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { LiveView, useLiveListState, LiveListEvent, useLiveAudienceState } from 'tuikit-atomicx-vue3';
import StreamMiniNav from '@/components/StreamMiniNav.vue';
import StreamChatPanel from '@/components/StreamChatPanel.vue';
import CoGuestPanel from '@/components/CoGuestPanel.vue';

const props = defineProps<{ liveId: string }>();
const router = useRouter();
const { joinLive, leaveLive, subscribeEvent, unsubscribeEvent } = useLiveListState();
const { audienceCount, fetchAudienceList } = useLiveAudienceState();

const status = ref<'joining' | 'watching' | 'ended' | 'kicked' | 'error'>('joining');
const errorMsg = ref('');

const streamTitle = computed(() => props.liveId.replace(/^live_/, '').replace(/_/g, ' ') || props.liveId);
const hostInitial = computed(() => streamTitle.value.charAt(0).toUpperCase());

const tags = ['Just Chatting', 'Live', 'English'];

function formatViewers(count: number): string {
  return count.toLocaleString();
}

function handleLiveEnded() {
  status.value = 'ended';
}
function handleKicked() {
  status.value = 'kicked';
}

onMounted(async () => {
  fetchAudienceList().catch(() => {});
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
  <div class="live-stream">
    <StreamMiniNav />

    <div class="content">
      <div class="player-section">
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

          <div v-if="status === 'watching'" class="video-badges">
            <span class="badge-live">Live</span>
            <span class="viewers">👁 {{ formatViewers(audienceCount) }} watching</span>
          </div>
        </div>

        <div v-if="status === 'watching'" class="stream-info">
          <div class="info-row">
            <div class="host-block">
              <span class="avatar">{{ hostInitial }}</span>
              <div class="host-text">
                <h1>{{ streamTitle }}</h1>
                <p>{{ liveId }} • Just Chatting • English</p>
              </div>
            </div>
            <div class="actions">
              <button class="primary follow-btn">Follow</button>
              <button class="subscribe-btn">Subscribe</button>
              <button class="gift-btn">🎁 Gift</button>
            </div>
          </div>
          <div class="tags">
            <span v-for="tag in tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
          <CoGuestPanel :is-host="false" />
        </div>
      </div>

      <StreamChatPanel v-if="status === 'watching'" />
    </div>
  </div>
</template>

<style scoped>
.live-stream {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--bg);
}

.content {
  display: flex;
  flex: 1;
  min-height: 0;
}

.player-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--video-area-bg);
}

.video-wrap {
  position: relative;
  flex: 1;
  min-height: 280px;
  background: var(--video-bg);
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
  background: var(--video-bg);
  text-align: center;
}

.overlay h3 {
  margin: 0;
}

.overlay p {
  margin: 0;
  color: var(--text-dim);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border);
  border-top-color: var(--brand);
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

.video-badges {
  position: absolute;
  top: var(--space-4);
  left: var(--space-4);
  display: flex;
  gap: var(--space-2);
  z-index: 2;
}

.viewers {
  background: rgba(0, 0, 0, 0.6);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.stream-info {
  background: var(--bg-elev);
  padding: var(--space-4) var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  flex-shrink: 0;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.host-block {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--brand-gradient);
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: var(--font-lg);
  flex-shrink: 0;
}

.host-text {
  min-width: 0;
}

.host-text h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.host-text p {
  margin: 4px 0 0;
  font-size: var(--font-base);
  color: var(--text-dim);
}

.actions {
  display: flex;
  gap: var(--space-2);
  flex-shrink: 0;
}

.follow-btn {
  padding: 10px 20px;
  font-weight: 600;
}

.subscribe-btn {
  padding: 10px 20px;
  background: transparent;
  border: 1px solid var(--brand);
  color: var(--brand);
  font-weight: 500;
}

.subscribe-btn:hover {
  background: var(--brand-soft);
}

.gift-btn {
  padding: 10px 20px;
  background: var(--gold);
  color: #1a1400;
  font-weight: 600;
}

.gift-btn:hover {
  filter: brightness(1.05);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.tag {
  padding: 4px 10px;
  background: var(--bg-elev-2);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-dim);
}

@media (max-width: 1024px) {
  .content {
    flex-direction: column;
  }

  .chat-panel {
    max-height: 360px;
  }
}
</style>
