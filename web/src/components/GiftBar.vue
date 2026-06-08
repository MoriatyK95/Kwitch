<script setup lang="ts">
/**
 * Likes + gifts — lightweight engagement.
 *
 * Powered by AtomicXCore's `useLiveGiftState`:
 *   - `sendLikes({ count })`         fire off likes (the ❤️ tap)
 *   - `totalLikeCount`               running total of likes in the room
 *   - `giftInfoList` / `refreshGiftList()`  catalog of gifts configured in the
 *                                    TRTC Console
 *   - `sendGift({ giftId, count })`  send a specific gift
 *
 * Gifts must be configured in the TRTC Console for `giftInfoList` to populate;
 * if it's empty we still show the Like button, which needs no config.
 */
import { onMounted } from 'vue';
import { useLiveGiftState } from 'tuikit-atomicx-vue3';

const { sendLikes, totalLikeCount, giftInfoList, refreshGiftList, sendGift } =
  useLiveGiftState();

onMounted(() => {
  // Pull the gift catalog (no-op visually if none configured in the Console).
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
  <div class="engage">
    <button class="like-btn" @click="like">❤️ Like</button>
    <span class="like-total">{{ totalLikeCount }} likes</span>

    <div v-if="giftInfoList.length" class="gifts">
      <template v-for="cat in giftInfoList" :key="cat.categoryID">
        <button
          v-for="g in cat.giftList"
          :key="g.giftID"
          class="gift-btn"
          :title="`${g.name} · ${g.coins} coins`"
          @click="gift(g.giftID)"
        >
          <img v-if="g.iconUrl" :src="g.iconUrl" :alt="g.name" />
          <span v-else>🎁</span>
        </button>
      </template>
    </div>
    <p v-else class="gift-hint">
      Configure gifts in the TRTC Console to enable the gift bar.
    </p>
  </div>
</template>

<style scoped>
.engage {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 10px 14px;
}
.like-btn {
  background: var(--accent);
}
.like-total {
  font-size: 13px;
  color: var(--text-dim);
}
.gifts {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.gift-btn {
  width: 40px;
  height: 40px;
  padding: 4px;
  display: grid;
  place-items: center;
}
.gift-btn img {
  max-width: 100%;
  max-height: 100%;
}
.gift-hint {
  font-size: 12px;
  color: var(--text-dim);
  margin: 0;
}
</style>
