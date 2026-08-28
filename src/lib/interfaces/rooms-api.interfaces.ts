export enum RoomDuration {
	HALF_HOUR = 'HALF_HOUR',
	ONE_HOUR = 'ONE_HOUR',
	THREE_HOURS = 'THREE_HOURS',
}

export interface RoomResponseData {
	roomId: string;
	lastActivity: string;
}

export interface CreateRoomRequest {
	duration: RoomDuration;
}

export interface RoomData {
	roomId: string;
	lastActivity: string;
}

export type CreateRoomResponseData = RoomData;

export type JoinRoomResponseData = RoomData;

export interface JoinRoomRequest {
	name: string;
}
