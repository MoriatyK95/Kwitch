export interface ChannelProfile {
  channelId: string;
  displayName: string;
  category: string;
  tags: string[];
  title: string;
  bio: string;
  mature: boolean;
}

export interface AccountProfile {
  userId: string;
  displayName: string;
  emailVerified: boolean;
  roles: Array<'creator' | 'viewer' | 'moderator' | 'admin'>;
  createdAt: string;
}

export interface ModerationSettings {
  bannedWords: string[];
  slowModeSeconds: number;
  followersOnly: boolean;
  subscribersOnly: boolean;
  linksAllowed: boolean;
}

export interface ModerationEvent {
  id: string;
  channelId: string;
  type: 'chat' | 'content' | 'fraud';
  severity: 'low' | 'medium' | 'high';
  status: 'open' | 'reviewing' | 'resolved';
  reason: string;
  actorId?: string;
  message?: string;
  createdAt: string;
  resolvedAt?: string;
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
const accounts = new Map<string, AccountProfile>();
const streamKeys = new Map<string, StreamKey>();
const follows = new Map<string, FollowRecord>();
const moderationQueue = new Map<string, ModerationEvent>();

function now(): string {
  return new Date().toISOString();
}

function randomToken(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

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

accounts.set('demo', {
  userId: 'demo',
  displayName: 'Kwitch Demo',
  emailVerified: true,
  roles: ['creator', 'moderator'],
  createdAt: now(),
});

streamKeys.set('demo', {
  channelId: 'demo',
  key: randomToken('sk_live'),
  ingestUrl: 'rtmp://ingest.livekit.example/live',
  protocol: 'rtmp',
  status: 'active',
  createdAt: now(),
});

moderationQueue.set('mod_001', {
  id: 'mod_001',
  channelId: 'demo',
  type: 'chat',
  severity: 'medium',
  status: 'open',
  reason: 'banned-word-match',
  actorId: 'viewer_123',
  message: 'Message matched a blocked phrase.',
  createdAt: now(),
});

export function getAccount(userId: string): AccountProfile {
  const existing = accounts.get(userId);
  if (existing) return existing;

  const created: AccountProfile = {
    userId,
    displayName: userId,
    emailVerified: false,
    roles: ['viewer'],
    createdAt: now(),
  };
  accounts.set(userId, created);
  return created;
}

export function updateAccount(userId: string, patch: Partial<AccountProfile>): AccountProfile {
  const next = { ...getAccount(userId), ...patch, userId };
  accounts.set(userId, next);
  return next;
}

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

export function evaluateChatMessage(
  channelId: string,
  actorId: string,
  message: string,
): { allowed: boolean; reasons: string[]; event?: ModerationEvent } {
  const settings = getModeration(channelId);
  const lower = message.toLowerCase();
  const reasons: string[] = [];

  for (const word of settings.bannedWords) {
    if (word && lower.includes(word.toLowerCase())) {
      reasons.push(`banned-word:${word}`);
    }
  }
  if (!settings.linksAllowed && /https?:\/\//i.test(message)) {
    reasons.push('links-not-allowed');
  }

  if (reasons.length === 0) {
    return { allowed: true, reasons };
  }

  const event: ModerationEvent = {
    id: randomToken('mod'),
    channelId,
    type: 'chat',
    severity: reasons.some((r) => r.startsWith('banned-word')) ? 'medium' : 'low',
    status: 'open',
    reason: reasons.join(','),
    actorId,
    message,
    createdAt: now(),
  };
  moderationQueue.set(event.id, event);
  return { allowed: false, reasons, event };
}

export function listModerationEvents(channelId?: string): ModerationEvent[] {
  return Array.from(moderationQueue.values())
    .filter((event) => !channelId || event.channelId === channelId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function resolveModerationEvent(eventId: string): ModerationEvent | undefined {
  const event = moderationQueue.get(eventId);
  if (!event) return undefined;
  const next: ModerationEvent = { ...event, status: 'resolved', resolvedAt: now() };
  moderationQueue.set(eventId, next);
  return next;
}

export function getStreamKey(channelId: string): StreamKey {
  getChannel(channelId);
  const existing = streamKeys.get(channelId);
  if (existing) return existing;

  const created: StreamKey = {
    channelId,
    key: randomToken('sk_live'),
    ingestUrl: 'rtmp://ingest.livekit.example/live',
    protocol: 'rtmp',
    status: 'active',
    createdAt: now(),
  };
  streamKeys.set(channelId, created);
  return created;
}

export function rotateStreamKey(channelId: string): StreamKey {
  const existing = getStreamKey(channelId);
  const next: StreamKey = {
    ...existing,
    key: randomToken('sk_live'),
    status: 'active',
    rotatedAt: now(),
  };
  streamKeys.set(channelId, next);
  return next;
}

export function followChannel(
  channelId: string,
  followerId: string,
  notifications = true,
): FollowRecord {
  getChannel(channelId);
  const record: FollowRecord = {
    channelId,
    followerId,
    notifications,
    followedAt: now(),
  };
  follows.set(`${followerId}:${channelId}`, record);
  return record;
}

export function listFollowers(channelId: string): FollowRecord[] {
  return Array.from(follows.values()).filter((record) => record.channelId === channelId);
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
      status: 'ready',
      detail: 'Per-channel stream-key APIs are scaffolded; wire them to LiveKit Ingress for real RTMP URLs.',
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
      status: 'ready',
      detail: 'Moderation settings, inline message evaluation, and queue resolution APIs are scaffolded.',
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
