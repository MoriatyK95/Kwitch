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

export function readinessItems() {
  return [
    {
      area: 'LiveKit WebRTC interactive path',
      status: 'ready',
      detail: 'Browser go-live, viewer subscribe, data-channel chat, and token grants are wired.',
    },
    {
      area: 'HLS/CDN scale fanout',
      status: 'needs_config',
      detail: 'Configure LiveKit Egress HLS output to object storage plus CDN distribution.',
    },
    {
      area: 'RTMP/OBS ingest',
      status: 'needs_config',
      detail: 'Provision LiveKit Ingress per-channel stream keys before creator launch.',
    },
    {
      area: 'Dedicated chat backbone',
      status: 'planned',
      detail: 'Move high-volume chat to sharded pub/sub with moderation hooks.',
    },
    {
      area: 'Payments and payouts',
      status: 'planned',
      detail: 'Add PSP, KYC, taxes, chargebacks, and payout rails.',
    },
  ];
}

export function demoChannel(channelId: string) {
  return {
    channelId,
    displayName: channelId === 'demo' ? 'Kwitch Demo' : channelId,
    category: 'Just Chatting',
    tags: ['LiveKit', 'Aurora', 'Launch'],
    title: `${channelId}'s live channel`,
    bio: 'Production-ready LiveKit channel profile.',
    mature: false,
  };
}

export function demoModeration() {
  return {
    bannedWords: ['scam', 'hate'],
    slowModeSeconds: 3,
    followersOnly: false,
    subscribersOnly: false,
    linksAllowed: false,
  };
}

export function demoAnalytics() {
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
