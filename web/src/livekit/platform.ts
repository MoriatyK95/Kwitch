import { ref } from 'vue';
import { livekitConfig } from './config';

export interface PlatformReadinessItem {
  area: string;
  status: 'ready' | 'needs_config' | 'planned';
  detail: string;
}

export interface ChannelProfile {
  channelId: string;
  displayName: string;
  category: string;
  tags: string[];
  title: string;
  bio: string;
  mature: boolean;
}

export interface ModerationSettings {
  bannedWords: string[];
  slowModeSeconds: number;
  followersOnly: boolean;
  subscribersOnly: boolean;
  linksAllowed: boolean;
}

export interface AccountProfile {
  userId: string;
  displayName: string;
  emailVerified: boolean;
  roles: string[];
  createdAt: string;
}

export interface StreamKey {
  channelId: string;
  key: string;
  ingestUrl: string;
  protocol: 'rtmp';
  status: 'active' | 'revoked';
  createdAt: string;
  rotatedAt?: string;
}

export interface FollowRecord {
  followerId: string;
  channelId: string;
  notifications: boolean;
  followedAt: string;
}

export interface ModerationEvent {
  id: string;
  channelId: string;
  type: string;
  severity: string;
  status: string;
  reason: string;
  actorId?: string;
  message?: string;
  createdAt: string;
}

export interface StreamAnalytics {
  averageWatchSeconds: number;
  chatMessagesPerMinute: number;
  follows: number;
  peakViewers: number;
  revenueCents: number;
  streamHealth: {
    ingestBitrateKbps: number;
    droppedFramesPercent: number;
    latencyMs: number;
    region: string;
  };
}

function api(path: string): string {
  const base = livekitConfig.tokenServerUrl.replace(/\/$/, '');
  return base ? `${base}${path}` : path;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(api(path));
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

async function postJson<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(api(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

export function useCreatorStudio(channelId = 'demo') {
  const account = ref<AccountProfile | null>(null);
  const readiness = ref<PlatformReadinessItem[]>([]);
  const channel = ref<ChannelProfile | null>(null);
  const moderation = ref<ModerationSettings | null>(null);
  const analytics = ref<StreamAnalytics | null>(null);
  const streamKey = ref<StreamKey | null>(null);
  const followers = ref<FollowRecord[]>([]);
  const safetyQueue = ref<ModerationEvent[]>([]);
  const moderationProbe = ref<{ allowed: boolean; reasons: string[] } | null>(null);
  const loading = ref(false);
  const error = ref('');

  async function refresh(): Promise<void> {
    loading.value = true;
    error.value = '';
    try {
      const [accountRes, readinessRes, channelRes, moderationRes, analyticsRes, streamKeyRes, followersRes, safetyRes] =
        await Promise.all([
          getJson<{ account: AccountProfile }>(`/accounts/${channelId}`),
          getJson<{ items: PlatformReadinessItem[] }>('/platform/readiness'),
          getJson<{ channel: ChannelProfile }>(`/channels/${channelId}`),
          getJson<{ moderation: ModerationSettings }>(`/channels/${channelId}/moderation`),
          getJson<{ analytics: StreamAnalytics }>(`/channels/${channelId}/analytics`),
          getJson<{ streamKey: StreamKey }>(`/channels/${channelId}/stream-key`),
          getJson<{ followers: FollowRecord[] }>(`/channels/${channelId}/followers`),
          getJson<{ queue: ModerationEvent[] }>(`/admin/safety/queue?channelId=${channelId}`),
        ]);

      account.value = accountRes.account;
      readiness.value = readinessRes.items;
      channel.value = channelRes.channel;
      moderation.value = moderationRes.moderation;
      analytics.value = analyticsRes.analytics;
      streamKey.value = streamKeyRes.streamKey;
      followers.value = followersRes.followers;
      safetyQueue.value = safetyRes.queue;
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
    } finally {
      loading.value = false;
    }
  }

  async function rotateStreamKey(): Promise<void> {
    const res = await postJson<{ streamKey: StreamKey }>(`/channels/${channelId}/stream-key/rotate`);
    streamKey.value = res.streamKey;
  }

  async function testModeration(message: string): Promise<void> {
    moderationProbe.value = await postJson<{ allowed: boolean; reasons: string[] }>(
      `/channels/${channelId}/moderation/evaluate`,
      { actorId: 'preview_user', message },
    );
    await refresh();
  }

  async function resolveQueueItem(eventId: string): Promise<void> {
    await postJson(`/admin/safety/queue/${eventId}/resolve`);
    await refresh();
  }

  return {
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
  };
}
