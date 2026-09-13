// TODO Remove these imports from here, or put the interfaces in this file somewhere
//  else this is shared logic
import { CollaborationHistoryEntryDraft, RoomHistoryState } from "@/interfaces";

export enum WsMessageType {
  CONNECTION_ESTABLISHED = 'CONNECTION_ESTABLISHED',
  USER_JOINED = 'USER_JOINED',
  USER_LEFT = 'USER_LEFT',
  ROOM_STATE = 'ROOM_STATE',
  YJS_SYNC_REQUEST = 'YJS_SYNC_REQUEST',
  YJS_SYNC_STEP_1 = 'YJS_SYNC_STEP_1',
  YJS_SYNC_STEP_2 = 'YJS_SYNC_STEP_2',
  YJS_UPDATE = 'YJS_UPDATE',
  HISTORY_ENTRY_COMMIT = 'HISTORY_ENTRY_COMMIT',
  ROOM_HISTORY_STATE = 'ROOM_HISTORY_STATE',
}

export interface ParticipantDetails {
  participantId: string;
  displayName: string;
}

export type WsMessageMap = {
  [WsMessageType.CONNECTION_ESTABLISHED]: {
    participantId: string;
    roomId: string;
    displayName: string;
    syncRequired: boolean;
  };
  [WsMessageType.USER_JOINED]: ParticipantDetails;
  [WsMessageType.USER_LEFT]: ParticipantDetails;
  [WsMessageType.ROOM_STATE]: {
    participants: ParticipantDetails[];
  };
  [WsMessageType.YJS_SYNC_REQUEST]: {
    peerParticipantId: string;
  };
  [WsMessageType.YJS_SYNC_STEP_1]: {
    peerParticipantId: string;
    stateVector: string;
  };
  [WsMessageType.YJS_SYNC_STEP_2]: {
    update: string;
  };
  [WsMessageType.YJS_UPDATE]: {
    update: string;
  };
  [WsMessageType.HISTORY_ENTRY_COMMIT]: CollaborationHistoryEntryDraft;
  [WsMessageType.ROOM_HISTORY_STATE]: RoomHistoryState;
};

export type WsMessage<T extends WsMessageType = WsMessageType> = {
  [K in T]: {
    type: K;
    message: WsMessageMap[K];
  };
}[T];