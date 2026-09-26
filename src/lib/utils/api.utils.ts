import { ToastService } from '@/ui/toast/toast.service';
import { ApiError } from '../errors';
import { ApiResponse } from '../interfaces';

export function createRequestHeaders(headers: HeadersInit | undefined, body: unknown): Headers {
  const requestHeaders = new Headers(headers);

  if (body !== undefined) {
    requestHeaders.set(
      'Content-Type',
      'application/json'
    );
  }

  return requestHeaders;
}

export function serializeBody(body: unknown): BodyInit | undefined {
  return body === undefined ? undefined : JSON.stringify(body);
}

export async function createHttpError(response: Response): Promise<ApiError> {
  const message = await getErrorMessage(response);

  return new ApiError(message, {
    type: 'http',
    status: response.status,
  });
}

async function getErrorMessage(response: Response): Promise<string> {
  const fallbackMessage = 'The request failed.';

  try {
    const responseBody: unknown =
      await response.json();

    if (
      responseBody !== null &&
      typeof responseBody === 'object' &&
      'message' in responseBody &&
      typeof responseBody.message === 'string'
    ) {
      return responseBody.message;
    }
  } catch {
    // The server did not return a JSON response.
  }

  return fallbackMessage;
}

export async function parseApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  try {
    return await response.json() as ApiResponse<T>;
  } catch (error) {
    throw new ApiError(
      'The server returned an invalid response.',
      {
        type: 'invalid-response',
        cause: error,
      }
    );
  }
}

export function normalizeApiError(error: unknown, timeoutController: AbortController): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (
    error instanceof DOMException &&
    error.name === 'AbortError'
  ) {
    return createAbortError(
      error,
      timeoutController.signal.aborted
    );
  }

  if (error instanceof TypeError) {
    return new ApiError(
      getNetworkErrorMessage(),
      {
        type: 'network',
        cause: error,
      }
    );
  }

  return new ApiError(
    'An unexpected error occurred.',
    {
      type: 'unknown',
      cause: error,
    }
  );
}

function createAbortError(error: DOMException, timedOut: boolean): ApiError {
  return new ApiError(
    (timedOut ? 'The request timed out. Please try again.' : 'The request was cancelled.'),
    {
      type: timedOut
        ? 'timeout'
        : 'cancelled',
      cause: error,
    }
  );
}

function getNetworkErrorMessage(): string {
  return navigator.onLine ? 'Unable to connect to the server.' : 'You appear to be offline. Please check your internet connection.';
}

export function showInfrastructureError(error: ApiError): void {
  switch (error.type) {
    case 'network':
    case 'timeout':
    case 'invalid-response':
    case 'unknown':
      ToastService.error(error.message);
      break;

    case 'http':
    case 'cancelled':
      break;
  }
}
