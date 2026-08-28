import { ApiResponse, AuthUser, LoginRequestData, RegisterRequestData, UserResponseData } from '@/lib/interfaces';
import { api } from './api';

export function login(loginRequestData: LoginRequestData): Promise<ApiResponse<UserResponseData>> {
  return api.post<UserResponseData>('/auth/login', loginRequestData);
}

export function signup(registerRequestData: RegisterRequestData): Promise<ApiResponse<UserResponseData>> {
  return api.post<UserResponseData>('/auth/signup', registerRequestData);
}

export function logout(): Promise<ApiResponse<null>> {
  return api.post<null>('/auth/logout');
}

export function getCurrentUser(): Promise<ApiResponse<AuthUser>> {
  return api.get<AuthUser>('/users/me');
}