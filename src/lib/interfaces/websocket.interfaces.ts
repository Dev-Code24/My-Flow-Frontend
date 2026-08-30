export enum WsMessageType {
  CONNECTION_ESTABLISHED = 'CONNECTION_ESTABLISHED',
  USER_JOINED = 'USER_JOINED',
  USER_LEFT = 'USER_LEFT',
  ROOM_STATE = 'ROOM_STATE',
  YJS_UPDATE = 'YJS_UPDATE',
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
  [WsMessageType.YJS_UPDATE]: {
    update: string;
  };
};

export type WsMessage<
  T extends WsMessageType = WsMessageType
> = {
  [K in T]: {
    type: K;
    message: WsMessageMap[K];
  };
}[T];