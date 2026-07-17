import { CreateRoomResponseData, CreateRoomRequest, JoinRoomResponseData, JoinRoomRequest, RoomResponseData, RoomDuration, RoomData, ApiResponse } from '@/lib/interfaces';
import { api } from './api';

export function createRoom(duration: RoomDuration): Promise<ApiResponse<RoomData>>{
  const request: CreateRoomRequest = {
    duration,
  };

  return api.post<CreateRoomResponseData>('/rooms/create', request);
}

export function joinRoom(roomId: string, name: string): Promise<ApiResponse<RoomData>> {
  const request: JoinRoomRequest = {
    name,
  };

  return api.post<JoinRoomResponseData>(`/rooms/${roomId}/join`, request);
}

export function getRoom(roomId: string): Promise<ApiResponse<RoomResponseData>> {
  return api.get<RoomResponseData>(`/rooms/${roomId}`);
}