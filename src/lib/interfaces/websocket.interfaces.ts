import { CollaborationHistoryEntryDraft, RoomHistoryState } from './history.interfaces';
import { Element } from './element.interfaces';

interface YjsUpdatePayload {
  updateId: string;
  update: string;
}

export interface HistoryNavigationRequest {
  requestId: string;
  expectedVersion: number;
}

export interface EditBeginRequest {
  editId: string;
  elementIds: string[];
}

export interface EditAccepted {
  editId: string;
}

export interface EditRejected {
  editId: string;
}

export interface EditKeepAlive {
  editId: string;
  elementIds: string[];
}

export interface EditEndRequest {
  editId: string;
  elementIds: string[];
}

interface YjsSyncPayload {
  update: string;
}

export interface ActiveEdit {
  editId: string;
  elementIds: string[];
  keepAliveTimer: ReturnType<
    typeof setInterval
  >;
}

export type ContinueImportPayload =
  | {
  action: 'request';
  requestId: string;
  elements: Element[];
}
  | {
  action: 'result';
  requestId: string;
  status: 'completed' | 'failed';
};

export enum WsMessageType {
  CONNECTION_ESTABLISHED = 'CONNECTION_ESTABLISHED',
  USER_JOINED = 'USER_JOINED',
  USER_LEFT = 'USER_LEFT',
  ROOM_STATE = 'ROOM_STATE',
  YJS_SYNC = 'YJS_SYNC',
  YJS_UPDATE = 'YJS_UPDATE',
  CONTINUE_IMPORT = 'CONTINUE_IMPORT',
  HISTORY_ENTRY_COMMIT = 'HISTORY_ENTRY_COMMIT',
  ROOM_HISTORY_STATE = 'ROOM_HISTORY_STATE',
  UNDO_REQUEST = 'UNDO_REQUEST',
  REDO_REQUEST = 'REDO_REQUEST',
  EDIT_BEGIN = 'EDIT_BEGIN',
  EDIT_ACCEPTED = 'EDIT_ACCEPTED',
  EDIT_REJECTED = 'EDIT_REJECTED',
  EDIT_KEEP_ALIVE = 'EDIT_KEEP_ALIVE',
  EDIT_END = 'EDIT_END',
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
  };
  [WsMessageType.USER_JOINED]: ParticipantDetails;
  [WsMessageType.USER_LEFT]: ParticipantDetails;
  [WsMessageType.ROOM_STATE]: {
    participants: ParticipantDetails[];
  };
  [WsMessageType.YJS_SYNC]: YjsSyncPayload;
  [WsMessageType.YJS_UPDATE]: YjsUpdatePayload;
  [WsMessageType.CONTINUE_IMPORT]: ContinueImportPayload;
  [WsMessageType.HISTORY_ENTRY_COMMIT]: CollaborationHistoryEntryDraft;
  [WsMessageType.ROOM_HISTORY_STATE]: RoomHistoryState;
  [WsMessageType.UNDO_REQUEST]: HistoryNavigationRequest;
  [WsMessageType.REDO_REQUEST]: HistoryNavigationRequest;
  [WsMessageType.EDIT_BEGIN]: EditBeginRequest;
  [WsMessageType.EDIT_ACCEPTED]: EditAccepted;
  [WsMessageType.EDIT_REJECTED]: EditRejected;
  [WsMessageType.EDIT_KEEP_ALIVE]: EditKeepAlive;
  [WsMessageType.EDIT_END]: EditEndRequest;
};

export type WsMessage<T extends WsMessageType = WsMessageType> = {
  [K in T]: {
    type: K;
    message: WsMessageMap[K];
  };
}[T];