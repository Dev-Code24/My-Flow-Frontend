import { ENV_CONFIG } from '@/lib/config';
import { ApiResponse, RequestOptions } from '@/lib/interfaces';
import { createHttpError, createRequestHeaders, normalizeApiError, parseApiResponse, serializeBody, showInfrastructureError } from '@/lib/utils';

const API_BASE_URL = ENV_CONFIG.API_BASE_URL;
const DEFAULT_TIMEOUT = 10_000;

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    body,
    timeout = DEFAULT_TIMEOUT,
    signal,
    headers,
    ...fetchOptions
  } = options;

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    timeoutController.abort();
  }, timeout);

  try {
    const response = await fetch(
      `${API_BASE_URL}${endpoint}`,
      {
        ...fetchOptions,
        signal: signal ? AbortSignal.any([ signal, timeoutController.signal ]) : timeoutController.signal,
        headers: createRequestHeaders(headers, body),
        body: serializeBody(body),
      }
    );

    if (!response.ok) {
      throw await createHttpError(response);
    }

    return await parseApiResponse<T>(response);
  } catch (error) {
    const apiError = normalizeApiError(
      error,
      timeoutController
    );

    showInfrastructureError(apiError);

    throw apiError;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
   get<T>(url: string, init?: Omit<RequestOptions, 'body' | 'method'>) {
      return request<T>(url, {
         ...init,
         method: 'GET',
      });
   },

   post<T>(
      url: string,
      body?: unknown,
      init?: Omit<RequestOptions, 'body' | 'method'>
   ) {
      return request<T>(url, {
         ...init,
         method: 'POST',
         body,
      });
   },

   put<T>(
      url: string,
      body?: unknown,
      init?: Omit<RequestOptions, 'body' | 'method'>
   ) {
      return request<T>(url, {
         ...init,
         method: 'PUT',
         body,
      });
   },

   patch<T>(
      url: string,
      body?: unknown,
      init?: Omit<RequestOptions, 'body' | 'method'>
   ) {
      return request<T>(url, {
         ...init,
         method: 'PATCH',
         body,
      });
   },

   delete<T>(
      url: string,
      init?: Omit<RequestOptions, 'body' | 'method'>
   ) {
      return request<T>(url, {
         ...init,
         method: 'DELETE',
      });
   },
};