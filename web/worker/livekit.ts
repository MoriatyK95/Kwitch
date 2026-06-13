import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

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

export interface LiveKitEnv {
  LIVEKIT_URL: string;
  LIVEKIT_API_KEY: string;
  LIVEKIT_API_SECRET: string;
  TOKEN_EXPIRE_SECONDS?: string;
}

function httpUrl(wsUrl: string): string {
  return wsUrl.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:');
}

export async function mintAccessToken(
  env: LiveKitEnv,
  req: TokenRequest,
): Promise<{ token: string; url: string }> {
  const ttl = Number(env.TOKEN_EXPIRE_SECONDS ?? 3600);
  const at = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
    identity: req.identity,
    name: req.name,
    ttl: `${ttl}s`,
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
    url: env.LIVEKIT_URL,
  };
}

export async function listStreams(env: LiveKitEnv): Promise<StreamInfo[]> {
  const client = new RoomServiceClient(
    httpUrl(env.LIVEKIT_URL),
    env.LIVEKIT_API_KEY,
    env.LIVEKIT_API_SECRET,
  );
  const rooms = await client.listRooms();
  return rooms
    .filter((room) => room.name.startsWith('live_'))
    .map((room) => {
      let meta: { title?: string; hostName?: string; hostId?: string } = {};
      if (room.metadata) {
        try {
          meta = JSON.parse(room.metadata) as typeof meta;
        } catch {
          /* ignore */
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
    })
    .sort((a, b) => b.currentViewerCount - a.currentViewerCount);
}

export async function updateStreamMetadata(
  env: LiveKitEnv,
  roomName: string,
  meta: { title: string; hostId: string; hostName: string },
): Promise<void> {
  const client = new RoomServiceClient(
    httpUrl(env.LIVEKIT_URL),
    env.LIVEKIT_API_KEY,
    env.LIVEKIT_API_SECRET,
  );
  await client.updateRoomMetadata(roomName, JSON.stringify(meta));
}
