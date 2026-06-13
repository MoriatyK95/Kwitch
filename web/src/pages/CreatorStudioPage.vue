<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { session, useCreatorStudio } from '@/livekit';

const channelId = computed(() => session.userId || 'demo');
const {
  account,
  readiness,
  channel,
  moderation,
  analytics,
  streamKey,
  followers,
  safetyQueue,
  moderationProbe,
  loading,
  error,
  refresh,
  rotateStreamKey,
  testModeration,
  resolveQueueItem,
} = useCreatorStudio(channelId.value);
const moderationText = ref('check this scam link https://example.com');

const readyCount = computed(() => readiness.value.filter((i) => i.status === 'ready').length);
const launchScore = computed(() =>
  readiness.value.length ? Math.round((readyCount.value / readiness.value.length) * 100) : 0,
);

function money(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function maskedKey(key: string): string {
  return `${key.slice(0, 10)}…${key.slice(-6)}`;
}

onMounted(refresh);
</script>

<template>
  <div class="studio">
    <header class="studio-hero">
      <div>
        <span class="eyebrow">Creator Studio</span>
        <h1>Production control center</h1>
        <p>
          Manage the surfaces a real streaming platform needs: ingest, hybrid
          WebRTC/HLS delivery, moderation, trust, and monetization readiness.
        </p>
      </div>
      <button class="brand" :disabled="loading" @click="refresh">
        {{ loading ? 'Refreshing…' : 'Refresh' }}
      </button>
    </header>

    <p v-if="error" class="error">{{ error }}</p>

    <section class="grid metrics">
      <article class="metric-card">
        <span class="label">Launch readiness</span>
        <strong>{{ launchScore }}%</strong>
        <span>{{ readyCount }} / {{ readiness.length }} production areas ready</span>
      </article>
      <article class="metric-card">
        <span class="label">Peak viewers</span>
        <strong>{{ analytics?.peakViewers ?? '—' }}</strong>
        <span>Route large passive audiences to HLS/CDN</span>
      </article>
      <article class="metric-card">
        <span class="label">Revenue demo</span>
        <strong>{{ analytics ? money(analytics.revenueCents) : '—' }}</strong>
        <span>Subs, tips, and ads require PSP integration</span>
      </article>
      <article class="metric-card">
        <span class="label">Moderation queue</span>
        <strong>{{ safetyQueue.length }}</strong>
        <span>Open trust & safety items</span>
      </article>
      <article class="metric-card">
        <span class="label">Followers</span>
        <strong>{{ followers.length }}</strong>
        <span>Notification-ready follower records</span>
      </article>
    </section>

    <section class="two-col">
      <article class="panel">
        <div class="panel-header">Channel</div>
        <div v-if="channel" class="panel-body">
          <h2>{{ channel.displayName }}</h2>
          <p>{{ channel.title }}</p>
          <div class="tags">
            <span v-for="tag in channel.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
          <dl>
            <div><dt>Category</dt><dd>{{ channel.category }}</dd></div>
            <div><dt>Mature</dt><dd>{{ channel.mature ? 'Yes' : 'No' }}</dd></div>
          </dl>
        </div>
      </article>

      <article class="panel">
        <div class="panel-header">Stream health</div>
        <div v-if="analytics" class="panel-body">
          <dl>
            <div><dt>Bitrate</dt><dd>{{ analytics.streamHealth.ingestBitrateKbps }} kbps</dd></div>
            <div><dt>Dropped frames</dt><dd>{{ analytics.streamHealth.droppedFramesPercent }}%</dd></div>
            <div><dt>Latency</dt><dd>{{ analytics.streamHealth.latencyMs }} ms</dd></div>
            <div><dt>Region</dt><dd>{{ analytics.streamHealth.region }}</dd></div>
          </dl>
        </div>
      </article>
    </section>

    <section class="two-col">
      <article class="panel">
        <div class="panel-header">Account & roles</div>
        <div v-if="account" class="panel-body">
          <h2>{{ account.displayName }}</h2>
          <dl>
            <div><dt>User ID</dt><dd>{{ account.userId }}</dd></div>
            <div><dt>Email verified</dt><dd>{{ account.emailVerified ? 'Yes' : 'No' }}</dd></div>
            <div><dt>Roles</dt><dd>{{ account.roles.join(', ') }}</dd></div>
          </dl>
        </div>
      </article>

      <article class="panel">
        <div class="panel-header">RTMP / OBS ingest</div>
        <div v-if="streamKey" class="panel-body">
          <dl>
            <div><dt>Server</dt><dd>{{ streamKey.ingestUrl }}</dd></div>
            <div><dt>Stream key</dt><dd>{{ maskedKey(streamKey.key) }}</dd></div>
            <div><dt>Status</dt><dd>{{ streamKey.status }}</dd></div>
          </dl>
          <button class="ghost rotate-btn" @click="rotateStreamKey">Regenerate stream key</button>
          <p class="muted">
            Production wiring: create a matching LiveKit Ingress per channel and store the
            generated RTMP URL/key in a database-backed secrets store.
          </p>
        </div>
      </article>
    </section>

    <section class="panel">
      <div class="panel-header">Hybrid delivery architecture</div>
      <div class="delivery">
        <div class="delivery-path active">
          <strong>Interactive path</strong>
          <span>LiveKit WebRTC</span>
          <p>Hosts, guests, moderators, and low-latency front-row viewers.</p>
        </div>
        <div class="delivery-path">
          <strong>Broadcast path</strong>
          <span>LiveKit Egress → HLS/LL-HLS → CDN</span>
          <p>Default fanout for large passive audiences with cost guardrails.</p>
        </div>
        <div class="delivery-path">
          <strong>Ingest</strong>
          <span>Browser WHIP/WebRTC now; RTMP/OBS next</span>
          <p>Per-channel stream keys and ingest health belong in the API layer.</p>
        </div>
      </div>
    </section>

    <section class="two-col">
      <article class="panel">
        <div class="panel-header">Moderation suite</div>
        <div v-if="moderation" class="panel-body">
          <dl>
            <div><dt>Slow mode</dt><dd>{{ moderation.slowModeSeconds }}s</dd></div>
            <div><dt>Followers-only</dt><dd>{{ moderation.followersOnly ? 'On' : 'Off' }}</dd></div>
            <div><dt>Sub-only</dt><dd>{{ moderation.subscribersOnly ? 'On' : 'Off' }}</dd></div>
            <div><dt>Links</dt><dd>{{ moderation.linksAllowed ? 'Allowed' : 'Blocked' }}</dd></div>
          </dl>
          <p class="muted">Banned words: {{ moderation.bannedWords.join(', ') || 'none' }}</p>
          <div class="moderation-test">
            <input v-model="moderationText" placeholder="Test a chat message against AutoMod" />
            <button class="primary" @click="testModeration(moderationText)">Evaluate</button>
          </div>
          <p v-if="moderationProbe" class="muted">
            Result: {{ moderationProbe.allowed ? 'allowed' : 'blocked' }}
            <span v-if="moderationProbe.reasons.length">
              — {{ moderationProbe.reasons.join(', ') }}
            </span>
          </p>
        </div>
      </article>

      <article class="panel">
        <div class="panel-header">Monetization roadmap</div>
        <ul class="check-list">
          <li>Subscription tiers + gifted subs</li>
          <li>Tips / bits with fraud controls</li>
          <li>SSAI ad stack for HLS playback</li>
          <li>KYC, tax, multi-currency payouts</li>
        </ul>
      </article>
    </section>

    <section class="panel">
      <div class="panel-header">Trust & safety queue</div>
      <div class="readiness-list">
        <div v-for="item in safetyQueue" :key="item.id" class="readiness-item">
          <span class="status needs_config">{{ item.severity }}</span>
          <div>
            <strong>{{ item.reason }}</strong>
            <p>{{ item.message || item.type }} · {{ item.status }}</p>
            <button class="ghost small-btn" @click="resolveQueueItem(item.id)">Resolve</button>
          </div>
        </div>
        <p v-if="safetyQueue.length === 0" class="muted">No open moderation items.</p>
      </div>
    </section>

    <section class="panel">
      <div class="panel-header">Production readiness checklist</div>
      <div class="readiness-list">
        <div v-for="item in readiness" :key="item.area" class="readiness-item">
          <span class="status" :class="item.status">{{ item.status.replace('_', ' ') }}</span>
          <div>
            <strong>{{ item.area }}</strong>
            <p>{{ item.detail }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.studio {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 1180px;
}

.studio-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-6);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-xl);
  background:
    radial-gradient(ellipse 70% 100% at 15% 0%, rgba(56, 225, 255, 0.14), transparent),
    var(--bg-elev);
}

.eyebrow,
.label {
  color: var(--brand);
  font-size: var(--font-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 800;
}

.studio-hero h1,
.panel-body h2 {
  margin: var(--space-1) 0;
}

.studio-hero p,
.muted,
.readiness-item p,
.delivery-path p {
  color: var(--text-dim);
  margin: 0;
}

.grid {
  display: grid;
  gap: var(--space-4);
}

.metrics {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.metric-card,
.panel {
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  background: var(--bg-elev);
  overflow: hidden;
}

.metric-card {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.metric-card strong {
  font-size: var(--font-2xl);
}

.metric-card span:last-child {
  color: var(--text-dim);
  font-size: var(--font-sm);
}

.two-col {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}

.panel-header {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border);
  font-weight: 800;
}

.panel-body {
  padding: var(--space-4);
}

dl {
  display: grid;
  gap: var(--space-2);
  margin: var(--space-4) 0 0;
}

dl div {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
}

dt {
  color: var(--text-dim);
}

dd {
  margin: 0;
  font-weight: 700;
}

.tags {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.tag {
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  background: var(--brand-soft);
  color: var(--brand);
  font-size: var(--font-xs);
  font-weight: 700;
}

.delivery {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-4);
  padding: var(--space-4);
}

.delivery-path {
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  background: var(--bg-elev-2);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.delivery-path.active {
  box-shadow: var(--brand-glow);
}

.delivery-path span {
  color: var(--brand);
  font-weight: 700;
}

.check-list,
.readiness-list {
  padding: var(--space-4);
  margin: 0;
}

.rotate-btn,
.small-btn {
  margin-top: var(--space-3);
}

.small-btn {
  padding: 6px 10px;
  font-size: var(--font-xs);
}

.moderation-test {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.moderation-test input {
  flex: 1;
}

.check-list {
  display: grid;
  gap: var(--space-2);
  color: var(--text-dim);
}

.readiness-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.readiness-item {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: var(--space-3);
  align-items: flex-start;
}

.status {
  padding: 4px 8px;
  border-radius: var(--radius-pill);
  text-align: center;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}

.status.ready {
  background: rgba(38, 222, 129, 0.16);
  color: #55ef9d;
}

.status.needs_config {
  background: rgba(255, 184, 77, 0.16);
  color: #ffc26b;
}

.status.planned {
  background: rgba(124, 108, 255, 0.16);
  color: var(--brand-2);
}

.error {
  color: var(--error);
}

@media (max-width: 1024px) {
  .metrics,
  .two-col,
  .delivery {
    grid-template-columns: 1fr;
  }

  .studio-hero {
    flex-direction: column;
  }
}
</style>
