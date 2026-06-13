<script setup lang="ts">
import { ref, nextTick, watch } from 'vue';
import { useLiveKitRoomContext, useRoomChat, session } from '@/livekit';

const roomRef = useLiveKitRoomContext();
const { messages, sendChat, sendLike } = useRoomChat(roomRef);

const draft = ref('');
const listEl = ref<HTMLElement | null>(null);

const quickGifts = [
  { emoji: '❤️', cost: 10, label: 'Heart' },
  { emoji: '🔥', cost: 50, label: 'Fire' },
  { emoji: '👑', cost: 500, label: 'Crown' },
  { emoji: '🚀', cost: 100, label: 'Rocket' },
  { emoji: '💎', cost: 1000, label: 'Diamond' },
];

async function send() {
  const text = draft.value.trim();
  if (!text) return;
  draft.value = '';
  await sendChat(text, session.userId, session.userName);
}

function like() {
  sendLike(session.userId, 1).catch(() => {});
}

watch(
  () => messages.value.length,
  async () => {
    await nextTick();
    if (listEl.value) listEl.value.scrollTop = listEl.value.scrollHeight;
  },
);

function authorColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  const hues = [280, 145, 83, 0, 30, 180];
  return `hsl(${hues[Math.abs(hash) % hues.length]}, 70%, 65%)`;
}
</script>

<template>
  <aside class="chat-panel">
    <div class="chat-header">
      <span>Stream Chat</span>
      <button class="settings-btn" title="Chat settings">⚙</button>
    </div>

    <div ref="listEl" class="messages">
      <p v-if="messages.length === 0" class="welcome-hint">
        Welcome to the stream! Say hello in chat.
      </p>
      <div v-for="msg in messages" :key="msg.id" class="msg">
        <span class="author" :style="{ color: authorColor(msg.identity) }">
          {{ msg.name || msg.identity }}:
        </span>
        <span class="body">{{ msg.text }}</span>
      </div>
    </div>

    <div class="quick-gifts">
      <div class="gifts-head">
        <span>Send a Gift</span>
        <span class="koins">💰 2,450 Koins</span>
      </div>
      <div class="gifts-row">
        <button
          v-for="g in quickGifts"
          :key="g.label"
          class="gift-chip"
          :title="`${g.label} (${g.cost})`"
          @click="like"
        >
          <span class="gift-emoji">{{ g.emoji }}</span>
          <span class="gift-cost">{{ g.cost }}</span>
        </button>
      </div>
    </div>

    <form class="chat-input" @submit.prevent="send">
      <input v-model="draft" placeholder="Send a message..." maxlength="200" />
      <button type="button" class="emoji-btn" title="Emoji">😊</button>
      <button type="submit" class="send-btn" :disabled="!draft.trim()">➤</button>
    </form>
  </aside>
</template>

<style scoped>
.chat-panel {
  width: var(--chat-width);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-elev);
  border-left: 1px solid var(--chat-border);
  min-height: 0;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 var(--space-4);
  background: var(--bg-elev-2);
  font-weight: 600;
  font-size: var(--font-base);
  flex-shrink: 0;
}

.settings-btn {
  background: transparent;
  color: var(--text-muted);
  padding: 0;
  font-size: var(--font-lg);
}

.settings-btn:hover {
  background: transparent;
  color: var(--text);
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-height: 0;
}

.welcome-hint {
  color: var(--text-muted);
  font-size: var(--font-sm);
  text-align: center;
  margin: auto;
}

.msg {
  font-size: 13px;
  line-height: 1.4;
  word-break: break-word;
}

.author {
  font-weight: 600;
}

.quick-gifts {
  padding: var(--space-2) var(--space-3);
  background: var(--bg-elev-2);
  border-top: 1px solid var(--chat-border);
  flex-shrink: 0;
}

.gifts-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
  font-size: 12px;
  font-weight: 600;
}

.koins {
  color: var(--gold);
  font-size: 11px;
  font-weight: 500;
}

.gifts-row {
  display: flex;
  justify-content: space-between;
  gap: 4px;
}

.gift-chip {
  width: 60px;
  height: 56px;
  padding: 6px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: var(--border);
  border-radius: var(--radius-lg);
}

.gift-chip:hover {
  background: var(--bg-hover);
}

.gift-emoji {
  font-size: 18px;
}

.gift-cost {
  font-size: 9px;
  color: var(--gold);
  font-weight: 500;
}

.chat-input {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  border-top: 1px solid var(--chat-border);
  flex-shrink: 0;
}

.chat-input input {
  flex: 1;
  height: 32px;
  background: var(--bg-elev-2);
  border: none;
  font-size: 13px;
}

.emoji-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  background: var(--bg-elev-2);
  font-size: var(--font-lg);
}

.send-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  background: var(--brand-gradient);
  color: #fff;
  font-weight: 700;
}

.send-btn:hover:not(:disabled) {
  filter: brightness(1.12);
}

.send-btn:disabled {
  opacity: 0.5;
}
</style>
