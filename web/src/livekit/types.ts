export interface StreamInfo {
  liveId: string;
  liveName: string;
  hostId: string;
  hostName: string;
  currentViewerCount: number;
}

export type ParticipantRole = 'host' | 'viewer' | 'guest';

export interface ChatMessage {
  id: string;
  identity: string;
  name: string;
  text: string;
  at: number;
}

export interface GuestRequest {
  identity: string;
  name: string;
}

export const DATA_TOPIC = 'kwitch';

export type DataMessage =
  | { type: 'chat'; text: string; name: string; identity: string }
  | { type: 'like'; count: number; identity: string }
  | { type: 'guest-request'; identity: string; name: string }
  | { type: 'guest-accept'; identity: string }
  | { type: 'guest-decline'; identity: string };
