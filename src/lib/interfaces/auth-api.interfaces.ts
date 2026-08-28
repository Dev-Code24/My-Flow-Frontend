export interface RegisterRequestData {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequestData {
  email: string;
  password: string;
}

export interface UserResponseData {
  email: string;
  name: string;
}

export interface AuthUser {
  name: string;
  email: string;
}