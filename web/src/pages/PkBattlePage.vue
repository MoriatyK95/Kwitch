<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const timeLeft = ref(272); // 04:32
let timer: ReturnType<typeof setInterval> | null = null;

const redScore = ref(12450);
const blueScore = ref(8320);

const battleChat = [
  'TeamRed_Fan: GO NINJA GO!!',
  "LunaSquad: Luna's gonna clutch this!",
  'GiftKing: sent Crown to NinjaK! +500 pts',
  'NeutralFan: this PK is insane rn',
  'RedArmy: NINJA UNSTOPPABLE',
  'BlueWave: sent Rocket to Luna! +100 pts',
  'PKMaster: best PK of the week',
];

const redGifts = ['Heart 10', 'Fire 50', 'Crown 500'];
const blueGifts = ['Heart 10', 'Fire 50', 'Crown 500'];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const scoreRedWidth = () => {
  const total = redScore.value + blueScore.value;
  return total ? `${(redScore.value / total) * 100}%` : '60%';
};

onMounted(() => {
  timer = setInterval(() => {
    if (timeLeft.value > 0) timeLeft.value -= 1;
  }, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div class="pk-battle">
    <header class="pk-header">
      <div class="arena-title">
        <span class="swords">⚔️</span>
        <span>PK BATTLE ARENA</span>
      </div>
      <div class="timer-block">
        <span class="timer-label">TIME LEFT</span>
        <span class="timer">{{ formatTime(timeLeft) }}</span>
      </div>
      <span class="watching">👁 45,218 watching</span>
    </header>

    <div class="score-bar">
      <div class="score-red" :style="{ width: scoreRedWidth() }">
        <span class="score">{{ redScore.toLocaleString() }}</span>
      </div>
      <div class="score-blue">
        <span class="score">{{ blueScore.toLocaleString() }}</span>
      </div>
      <span class="vs-badge">VS</span>
    </div>

    <div class="pk-content">
      <section class="streamer streamer-red">
        <div class="video-placeholder" />
        <div class="streamer-tag">
          <span class="tag-avatar">N</span>
          <span>NinjaK</span>
        </div>
        <div class="gift-pop">Crown x3! +1500 pts</div>
        <div class="streamer-meta">
          <h2>Fortnite Ranked Grind</h2>
          <p>Team RED • {{ redScore.toLocaleString() }} points • 18.2K viewers</p>
        </div>
      </section>

      <section class="center-panel">
        <div class="support support-red">
          <h3>Support NinjaK</h3>
          <div class="gift-btns">
            <button v-for="g in redGifts" :key="g" class="gift-btn">{{ g }}</button>
          </div>
        </div>

        <div class="battle-chat">
          <h3>Battle Chat</h3>
          <p v-for="(line, i) in battleChat" :key="i" class="chat-line">{{ line }}</p>
        </div>

        <div class="support support-blue">
          <h3>Support LunaStream</h3>
          <div class="gift-btns">
            <button v-for="g in blueGifts" :key="g" class="gift-btn">{{ g }}</button>
          </div>
        </div>

        <p class="pk-rules">PK Rules: Gifts add points. Most points wins. 5 min battle.</p>
      </section>

      <section class="streamer streamer-blue">
        <div class="video-placeholder" />
        <div class="streamer-tag blue">
          <span class="tag-avatar">L</span>
          <span>LunaStream</span>
        </div>
        <div class="streamer-meta">
          <h2>Valorant Immortal Push</h2>
          <p>Team BLUE • {{ blueScore.toLocaleString() }} points • 14.5K viewers</p>
        </div>
      </section>
    </div>

    <button class="exit-btn" @click="router.push('/')">← Exit PK Arena</button>
  </div>
</template>

<style scoped>
.pk-battle {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--bg);
  position: relative;
}

.pk-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 var(--space-6);
  background: var(--pk-header-bg);
  border-bottom: 2px solid var(--brand);
  flex-shrink: 0;
}

.arena-title {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 18px;
  background: var(--brand-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.swords {
  font-size: 24px;
}

.timer-block {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.timer-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
}

.timer {
  background: var(--live);
  color: #fff;
  font-weight: 700;
  font-size: 20px;
  padding: 6px 16px;
  border-radius: var(--radius-lg);
}

.watching {
  font-size: var(--font-base);
  color: var(--text-dim);
  font-weight: 500;
}

.score-bar {
  position: relative;
  display: flex;
  height: 48px;
  flex-shrink: 0;
  background: var(--bg-elev);
}

.score-red {
  background: rgba(255, 61, 110, 0.8);
  display: flex;
  align-items: center;
  padding-left: var(--space-6);
  min-width: 120px;
}

.score-blue {
  flex: 1;
  background: rgba(56, 182, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: var(--space-6);
}

.score {
  font-weight: 700;
  font-size: var(--font-lg);
}

.vs-badge {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--bg-elev-2);
  border: 2px solid var(--gold);
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 700;
  color: var(--gold);
}

.pk-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 400px 1fr;
  min-height: 0;
}

.streamer {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.streamer-red {
  background: var(--team-red-bg);
  border-right: 2px solid var(--team-red);
}

.streamer-blue {
  background: var(--team-blue-bg);
  border-left: 2px solid var(--team-blue);
}

.video-placeholder {
  flex: 1;
  min-height: 200px;
  background: var(--team-red-panel);
}

.streamer-blue .video-placeholder {
  background: var(--team-blue-panel);
}

.streamer-tag {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: var(--team-red);
  border-radius: 4px;
  font-size: 13px;
  font-weight: 700;
}

.streamer-tag.blue {
  background: var(--team-blue);
}

.tag-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.3);
  display: grid;
  place-items: center;
  font-size: 11px;
}

.gift-pop {
  position: absolute;
  bottom: 120px;
  right: 16px;
  padding: 8px 12px;
  background: rgba(255, 215, 0, 0.9);
  color: #1a1400;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
}

.streamer-meta {
  padding: var(--space-4);
  flex-shrink: 0;
}

.streamer-meta h2 {
  margin: 0 0 var(--space-2);
  font-size: var(--font-lg);
}

.streamer-meta p {
  margin: 0;
  font-size: 12px;
  color: var(--text-dim);
}

.center-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-3);
  background: var(--bg-elev);
  border-left: 1px solid var(--chat-border);
  border-right: 1px solid var(--chat-border);
  min-height: 0;
  overflow-y: auto;
}

.support {
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  flex-shrink: 0;
}

.support-red {
  background: var(--team-red-panel);
  border: 1px solid var(--team-red);
}

.support-red h3 {
  color: var(--team-red);
}

.support-blue {
  background: var(--team-blue-panel);
  border: 1px solid var(--team-blue);
}

.support-blue h3 {
  color: var(--team-blue);
}

.support h3 {
  margin: 0 0 var(--space-2);
  font-size: 13px;
  font-weight: 600;
}

.gift-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.gift-btn {
  padding: 6px 8px;
  font-size: 11px;
  font-weight: 500;
  background: var(--bg-elev-2);
  border-radius: 6px;
}

.battle-chat {
  flex: 1;
  min-height: 200px;
  padding: var(--space-2);
  background: var(--bg-elev-2);
  border-radius: var(--radius-lg);
  overflow-y: auto;
}

.battle-chat h3 {
  margin: 0 0 var(--space-2);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-dim);
}

.chat-line {
  margin: 0 0 6px;
  font-size: 11px;
  line-height: 1.4;
}

.pk-rules {
  margin: 0;
  font-size: 10px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.exit-btn {
  position: absolute;
  bottom: var(--space-4);
  left: var(--space-4);
  background: var(--bg-elev-2);
  font-size: var(--font-sm);
  z-index: 2;
}

@media (max-width: 1100px) {
  .pk-content {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
  }

  .streamer {
    min-height: 240px;
  }

  .center-panel {
    order: 3;
  }
}
</style>
