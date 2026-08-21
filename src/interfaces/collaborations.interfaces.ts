import { RoomDuration, RoomRole } from "@/lib/interfaces";

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