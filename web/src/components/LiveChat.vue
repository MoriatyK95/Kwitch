<script setup lang="ts">
/**
 * Live chat / barrage — the heart of a Twitch/Kick channel.
 *
 * Powered by AtomicXCore's `useBarrageState`:
 *   - `messageList`  reactive array of all chat messages in the live room
 *   - `sendTextMessage({ text })`  sends a text message to everyone
 * We just render the list and wire an input box to it.
 */
import { ref, nextTick, watch } from 'vue';
import { useBarrageState } from 'tuikit-atomicx-vue3';

const { messageList, sendTextMessage } = useBarrageState();

const draft = ref('');
const listEl = ref<HTMLElement | null>(null);

async function send() {
  const text = draft.value.trim();
  if (!text) return;
  draft.value = '';
  // The SDK broadcasts this to every participant; it also appears in our own
  // messageList via the SDK's reactive state, so we don't append manually.
  await sendTextMessage({ text });
}

// Auto-scroll to the newest message whenever the list grows.
watch(
  () => messageList.value.length,
  async () => {
    await nextTick();
    if (listEl.value) listEl.value.scrollTop = listEl.value.scrollHeight;
  },
);
</script>

<template>
  <div class="chat">
    <div class="chat-header">Stream Chat</div>
    <div ref="listEl" class="chat-list">
      <p v-if="messageList.length === 0" class="empty">
        No messages yet. Say hello! 👋
      </p>
      <div v-for="msg in messageList" :key="msg.sequence" class="chat-msg">
        <span class="author">{{ msg.sender.userName || msg.sender.userId }}:</span>
        <span class="body">{{ msg.textContent }}</span>
      </div>
    </div>
    <form class="chat-input" @submit.prevent="send">
      <input v-model="draft" placeholder="Send a message" maxlength="200" />
      <button type="submit" class="primary">Chat</button>
    </form>
  </div>
</template>

<style scoped>
.chat {
  display: flex;
  flex-direction: column;
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  height: 100%;
  min-height: 0;
}
.chat-header {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  font-weight: 700;
  font-size: 13px;
  text-transform: uppercase;
  color: var(--text-dim);
}
.chat-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.empty {
  color: var(--text-dim);
  font-size: 13px;
}
.chat-msg {
  font-size: 14px;
  line-height: 1.4;
  word-break: break-word;
}
.author {
  color: var(--accent);
  font-weight: 700;
  margin-right: 4px;
}
.chat-input {
  display: flex;
  gap: 8px;
  padding: 10px;
  border-top: 1px solid var(--border);
}
.chat-input input {
  flex: 1;
}
</style>
