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

export interface PlatformReadinessItem {
  area: string;
  status: 'ready' | 'needs_config' | 'planned';
  detail: string;
}

const channels = new Map<string, ChannelProfile>();
const moderation = new Map<string, ModerationSettings>();

channels.set('demo', {
  channelId: 'demo',
  displayName: 'Kwitch Demo',
  category: 'Just Chatting',
  tags: ['LiveKit', 'Aurora', 'Launch'],
  title: 'Building the next livestream platform',
  bio: 'Production-ready LiveKit channel profile used as the default template.',
  mature: false,
});

moderation.set('demo', {
  bannedWords: ['scam', 'hate'],
  slowModeSeconds: 3,
  followersOnly: false,
  subscribersOnly: false,
  linksAllowed: false,
});

export function getChannel(channelId: string): ChannelProfile {
  const existing = channels.get(channelId);
  if (existing) return existing;

  const created: ChannelProfile = {
    channelId,
    displayName: channelId,
    category: 'Just Chatting',
    tags: [],
    title: `${channelId}'s live channel`,
    bio: '',
    mature: false,
  };
  channels.set(channelId, created);
  moderation.set(channelId, {
    bannedWords: [],
    slowModeSeconds: 0,
    followersOnly: false,
    subscribersOnly: false,
    linksAllowed: false,
  });
  return created;
}

export function updateChannel(channelId: string, patch: Partial<ChannelProfile>): ChannelProfile {
  const next = { ...getChannel(channelId), ...patch, channelId };
  channels.set(channelId, next);
  return next;
}

export function getModeration(channelId: string): ModerationSettings {
  getChannel(channelId);
  return moderation.get(channelId)!;
}

export function updateModeration(
  channelId: string,
  patch: Partial<ModerationSettings>,
): ModerationSettings {
  const next = { ...getModeration(channelId), ...patch };
  moderation.set(channelId, next);
  return next;
}

export function getAnalytics(_channelId: string): StreamAnalytics {
  return {
    averageWatchSeconds: 842,
    chatMessagesPerMinute: 19,
    follows: 128,
    peakViewers: 420,
    revenueCents: 18450,
    streamHealth: {
      ingestBitrateKbps: 6200,
      droppedFramesPercent: 0.4,
      latencyMs: 740,
      region: 'LiveKit Cloud auto',
    },
  };
}

export function getReadiness(): PlatformReadinessItem[] {
  return [
    {
      area: 'LiveKit WebRTC interactive path',
      status: 'ready',
      detail: 'Browser go-live, viewer subscribe, data-channel chat, and token grants are wired.',
    },
    {
      area: 'HLS/CDN scale fanout',
      status: 'needs_config',
      detail: 'Production needs LiveKit Egress HLS output to object storage plus CDN distribution.',
    },
    {
      area: 'RTMP/OBS ingest',
      status: 'needs_config',
      detail: 'Use LiveKit Ingress per-channel stream keys; API surface is scaffolded for stream keys.',
    },
    {
      area: 'Dedicated chat backbone',
      status: 'planned',
      detail: 'Data packets cover low-volume rooms; Twitch-scale chat needs sharded pub/sub.',
    },
    {
      area: 'Payments and payouts',
      status: 'planned',
      detail: 'Subscriptions, tips, KYC, taxes, and chargeback handling require PSP integration.',
    },
    {
      area: 'Trust and safety',
      status: 'needs_config',
      detail: 'Moderation settings exist; add auth, audit logs, AutoMod, reporting, and policy workflows.',
    },
  ];
}

export function platformManifest() {
  return {
    delivery: {
      interactive: 'LiveKit WebRTC',
      broadcast: 'LiveKit Egress -> HLS/LL-HLS -> CDN',
      routingPolicy: 'Use WebRTC for hosts, guests, moderators, and low-latency front-row viewers.',
    },
    productSurfaces: [
      'creator-dashboard',
      'channel-page',
      'moderation-suite',
      'stream-health',
      'analytics',
      'monetization-placeholders',
    ],
  };
}
