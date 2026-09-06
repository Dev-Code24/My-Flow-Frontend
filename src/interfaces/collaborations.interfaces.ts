import { RoomDuration, RoomRole } from '@/lib/interfaces';
import { Element } from '@/interfaces';

export interface RoomCollaborationOptions {
  duration: RoomDuration;
  displayName?: string;
}

export interface CollaborationRoomEntry {
  roomId: string;
  displayName?: string;
}

export interface CollaborationParticipant {
  roomId: string;
  participantId: string;
  displayName: string;
  role: RoomRole;
}

export type CollaborationEntryMode = 'continue' | 'clean';

export interface CollaborationSnapshot {
  roomId: string;
  elements: Element[];
  updatedAt: number;
  lastAccessedAt: number;
}