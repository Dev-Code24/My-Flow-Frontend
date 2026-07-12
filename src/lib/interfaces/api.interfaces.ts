export interface RequestOptions extends Omit<RequestInit, "body" | "signal"> {
  body?: unknown;
  signal?: AbortSignal;
  timeout?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  message: string;
  timestamp: string;
}
