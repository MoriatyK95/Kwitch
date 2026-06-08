<script setup lang="ts">
import { ref, nextTick, watch } from 'vue';
import { useBarrageState } from 'tuikit-atomicx-vue3';

const { messageList, sendTextMessage } = useBarrageState();
const draft = ref('');
const listEl = ref<HTMLElement | null>(null);

async function send() {
  const text = draft.value.trim();
  if (!text) return;
  draft.value = '';
  await sendTextMessage({ text });
}

watch(
  () => messageList.value.length,
  async () => {
    await nextTick();
    if (listEl.value) listEl.value.scrollTop = listEl.value.scrollHeight;
  },
);

function authorColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  const hues = [280, 145, 200, 30, 0, 180];
  return `hsl(${hues[Math.abs(hash) % hues.length]}, 70%, 65%)`;
}
</script>

<template>
  <div class="chat">
    <div class="chat-header">Stream Chat</div>
    <div ref="listEl" class="chat-list">
      <p v-if="messageList.length === 0" class="empty">Welcome to the chat room!</p>
      <div v-for="msg in messageList" :key="msg.sequence" class="chat-msg">
        <span class="author" :style="{ color: authorColor(msg.sender.userId) }">
          {{ msg.sender.userName || msg.sender.userId }}:
        </span>
        <span class="body">{{ msg.textContent }}</span>
      </div>
    </div>
    <form class="chat-input" @submit.prevent="send">
      <input v-model="draft" placeholder="Send a message" maxlength="200" />
      <button type="submit" class="send-btn" :disabled="!draft.trim()">Chat</button>
    </form>
  </div>
</template>

<style scoped>
.chat {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.chat-header {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border);
  font-weight: 700;
  font-size: var(--font-sm);
  flex-shrink: 0;
}

.chat-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-3) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.empty {
  color: var(--text-muted);
  font-size: var(--font-sm);
  text-align: center;
  margin: auto;
}

.chat-msg {
  font-size: var(--font-sm);
  line-height: 1.5;
  word-break: break-word;
}

.author {
  font-weight: 700;
}

.chat-input {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-3);
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

.chat-input input {
  flex: 1;
  background: var(--bg);
}

.send-btn {
  background: var(--accent);
  color: #fff;
}

.send-btn:hover:not(:disabled) {
  background: var(--accent-hover);
}

.send-btn:disabled {
  background: var(--bg-elev-2);
  color: var(--text-muted);
}
</style>
