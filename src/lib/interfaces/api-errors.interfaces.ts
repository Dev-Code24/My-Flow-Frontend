export type ApiErrorType = "network" | "timeout" | "http" | "invalid-response" | "unknown" | "cancelled";

export interface ApiErrorOptions {
  type: ApiErrorType;
  status?: number;
  cause?: unknown;
}