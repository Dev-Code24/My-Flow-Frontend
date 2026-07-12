import { ApiErrorOptions, ApiErrorType } from "@/lib/interfaces";

export class ApiError extends Error {
  public readonly type: ApiErrorType;
  public readonly status?: number;

  constructor(
    message: string,
    {
      type,
      status,
      cause,
    }: ApiErrorOptions
  ) {
    super(message, { cause });

    this.name = "ApiError";
    this.type = type;
    this.status = status;
  }
}