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

export function useCreatorStudio(channelId = 'demo') {
  const readiness = ref<PlatformReadinessItem[]>([]);
  const channel = ref<ChannelProfile | null>(null);
  const moderation = ref<ModerationSettings | null>(null);
  const analytics = ref<StreamAnalytics | null>(null);
  const safetyQueue = ref<unknown[]>([]);
  const loading = ref(false);
  const error = ref('');

  async function refresh(): Promise<void> {
    loading.value = true;
    error.value = '';
    try {
      const [readinessRes, channelRes, moderationRes, analyticsRes, safetyRes] =
        await Promise.all([
          getJson<{ items: PlatformReadinessItem[] }>('/platform/readiness'),
          getJson<{ channel: ChannelProfile }>(`/channels/${channelId}`),
          getJson<{ moderation: ModerationSettings }>(`/channels/${channelId}/moderation`),
          getJson<{ analytics: StreamAnalytics }>(`/channels/${channelId}/analytics`),
          getJson<{ queue: unknown[] }>('/admin/safety/queue'),
        ]);

      readiness.value = readinessRes.items;
      channel.value = channelRes.channel;
      moderation.value = moderationRes.moderation;
      analytics.value = analyticsRes.analytics;
      safetyQueue.value = safetyRes.queue;
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
    } finally {
      loading.value = false;
    }
  }

  return { readiness, channel, moderation, analytics, safetyQueue, loading, error, refresh };
}
