<script setup lang="ts">
import { onMounted } from 'vue';
import { useLiveGiftState } from 'tuikit-atomicx-vue3';

const { sendLikes, totalLikeCount, giftInfoList, refreshGiftList, sendGift } =
  useLiveGiftState();

onMounted(() => {
  refreshGiftList().catch((e) => console.warn('[gifts] refresh failed', e));
});

function like() {
  sendLikes({ count: 1 }).catch((e) => console.warn('[gifts] like failed', e));
}

function gift(giftId: string) {
  sendGift({ giftId, count: 1 }).catch((e) => console.warn('[gifts] send failed', e));
}
</script>

<template>
  <div class="engage panel">
    <button class="like-btn" @click="like">Like</button>
    <span class="like-total"><strong>{{ totalLikeCount }}</strong> likes</span>

    <div v-if="giftInfoList.length" class="gifts">
      <button
        v-for="g in giftInfoList.flatMap((cat) => cat.giftList)"
        :key="g.giftID"
        class="gift-btn"
        :title="`${g.name} · ${g.coins} coins`"
        @click="gift(g.giftID)"
      >
        <img v-if="g.iconUrl" :src="g.iconUrl" :alt="g.name" />
        <span v-else>🎁</span>
      </button>
    </div>
    <p v-else class="gift-hint">Configure gifts in the TRTC Console to enable the gift bar.</p>
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
}

.gift-btn:hover {
  border-color: var(--brand);
}

.gift-btn img {
  max-width: 100%;
  max-height: 100%;
}

.gift-hint {
  font-size: var(--font-xs);
  color: var(--text-muted);
  margin: 0;
}
</style>
