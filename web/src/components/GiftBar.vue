<script setup lang="ts">
import { useLiveKitRoomContext, useRoomChat, session } from '@/livekit';

const roomRef = useLiveKitRoomContext();
const { totalLikes, sendLike } = useRoomChat(roomRef);

const quickGifts = [
  { emoji: '❤️', label: 'Heart' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '👑', label: 'Crown' },
  { emoji: '🚀', label: 'Rocket' },
  { emoji: '💎', label: 'Diamond' },
];

function like() {
  sendLike(session.userId, 1).catch(() => {});
}

function gift() {
  like();
}
</script>

<template>
  <div class="engage panel">
    <button class="like-btn" @click="like">Like</button>
    <span class="like-total"><strong>{{ totalLikes }}</strong> likes</span>

    <div class="gifts">
      <button
        v-for="g in quickGifts"
        :key="g.label"
        class="gift-btn"
        :title="g.label"
        @click="gift"
      >
        <span>{{ g.emoji }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.engage {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
  padding: var(--space-3) var(--space-4);
}

.like-btn {
  background: var(--brand-gradient);
  color: #fff;
  font-weight: 700;
}

.like-btn:hover {
  filter: brightness(1.12);
}

.like-total {
  font-size: var(--font-sm);
  color: var(--text-dim);
}

.like-total strong {
  color: var(--brand);
}

.gifts {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-left: auto;
}

.gift-btn {
  width: 40px;
  height: 40px;
  padding: 4px;
  display: grid;
  place-items: center;
  background: var(--bg-elev-2);
  border: 1px solid var(--border);
  font-size: 18px;
}

.gift-btn:hover {
  border-color: var(--brand);
}
</style>
