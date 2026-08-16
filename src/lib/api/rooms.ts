import {
  CreateRoomResponseData, CreateRoomRequest, JoinRoomResponseData, JoinRoomRequest, RoomResponseData, RoomDuration,
  ApiResponse
} from '@/lib/interfaces';
import { api } from './api';

export function createRoom(duration: RoomDuration): Promise<ApiResponse<CreateRoomResponseData>>{
  const request: CreateRoomRequest = {
    duration,
  };

  return api.post<CreateRoomResponseData>('/rooms/create', request);
}

export function joinRoom(roomId: string, displayName?: string): Promise<ApiResponse<JoinRoomResponseData>> {
  const request: JoinRoomRequest = {
    name: displayName ?? null,
  };

  return api.post<JoinRoomResponseData>(`/rooms/${roomId}/join`, request);
}

export function getRoom(roomId: string): Promise<ApiResponse<RoomResponseData>> {
  return api.get<RoomResponseData>(`/rooms/${roomId}`);
}