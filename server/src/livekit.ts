import { AccessToken, RoomServiceClient, type Room } from 'livekit-server-sdk';
import type { ServerConfig } from './config.js';

export type ParticipantRole = 'host' | 'viewer' | 'guest';

export interface TokenRequest {
  identity: string;
  name: string;
  roomName: string;
  role: ParticipantRole;
}

export interface StreamInfo {
  liveId: string;
  liveName: string;
  hostId: string;
  hostName: string;
  currentViewerCount: number;
}

function httpUrl(wsUrl: string): string {
  return wsUrl.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:');
}

export function createRoomClient(config: ServerConfig): RoomServiceClient {
  return new RoomServiceClient(httpUrl(config.livekitUrl), config.apiKey, config.apiSecret);
}

export async function mintAccessToken(
  config: ServerConfig,
  req: TokenRequest,
): Promise<{ token: string; url: string }> {
  const at = new AccessToken(config.apiKey, config.apiSecret, {
    identity: req.identity,
    name: req.name,
    ttl: `${config.tokenExpireSeconds}s`,
  });
  at.addGrant({
    roomJoin: true,
    room: req.roomName,
    canPublish: req.role === 'host' || req.role === 'guest',
    canSubscribe: true,
    canPublishData: true,
  });
  return {
    token: await at.toJwt(),
    url: config.livekitUrl,
  };
}

export function roomToStream(room: Room): StreamInfo {
  let meta: { title?: string; hostName?: string; hostId?: string } = {};
  if (room.metadata) {
    try {
      meta = JSON.parse(room.metadata) as typeof meta;
    } catch {
      /* ignore malformed metadata */
    }
  }
  const hostId = meta.hostId || room.name.replace(/^live_/, '');
  return {
    liveId: room.name,
    liveName: meta.title || room.name,
    hostId,
    hostName: meta.hostName || hostId,
    currentViewerCount: Math.max(0, room.numParticipants - 1),
  };
}

export async function listStreams(config: ServerConfig): Promise<StreamInfo[]> {
  const client = createRoomClient(config);
  const rooms = await client.listRooms();
  return rooms
    .filter((room) => room.name.startsWith('live_'))
    .map(roomToStream)
    .sort((a, b) => b.currentViewerCount - a.currentViewerCount);
}

export async function updateStreamMetadata(
  config: ServerConfig,
  roomName: string,
  meta: { title: string; hostId: string; hostName: string },
): Promise<void> {
  const client = createRoomClient(config);
  await client.updateRoomMetadata(roomName, JSON.stringify(meta));
}
