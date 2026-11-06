import type { SessionStore } from '../session/SessionStore';
import { trimTrailingSlashes } from '../utils/url';
import { ApiError } from './ApiError';
import type { ConnectionMonitor } from './ConnectionMonitor';
import type { IApiClient } from './IApiClient';

type FetchFn = typeof fetch;

export interface HttpApiClientOptions {
  baseUrl: string;
  timeoutMs: number;
  session: SessionStore;
  monitor: ConnectionMonitor;
  fetchFn?: FetchFn;
  /** Chamado com cada resposta de erro da API (I069: ERR-01 e ERR-07 tratados pela sessão). */
  onError?: (error: ApiError) => void;
}

/** Cliente da API v02 sobre fetch: JSON, credencial Bearer, X-Client-App: web e tempo limite (secção 4.1). */
export class HttpApiClient implements IApiClient {
  static readonly CLIENT_APP = 'web';

  private readonly baseUrl: string;

  private readonly timeoutMs: number;

  private readonly session: SessionStore;

  private readonly monitor: ConnectionMonitor;

  private readonly fetchFn: FetchFn;

  private readonly onError?: (error: ApiError) => void;

  constructor(options: HttpApiClientOptions) {
    this.baseUrl = trimTrailingSlashes(options.baseUrl);
    this.timeoutMs = options.timeoutMs;
    this.session = options.session;
    this.monitor = options.monitor;
    this.fetchFn = options.fetchFn ?? ((input, init) => fetch(input, init));
    this.onError = options.onError;
  }

  async get<T>(path: string): Promise<T> {
    return (await this.json('GET', path)) as T;
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return (await this.json('POST', path, body)) as T;
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return (await this.json('PUT', path, body)) as T;
  }

  async delete(path: string): Promise<void> {
    await this.json('DELETE', path);
  }

  async upload(method: 'POST' | 'PUT', path: string, file: File): Promise<string | null> {
    const form = new FormData();
    form.append('file', file);
    const response = await this.request(method, path, form);
    return response.headers.get('Location');
  }

  async getFile(path: string): Promise<Blob> {
    const response = await this.request('GET', path);
    return response.blob();
  }

  private async json(method: string, path: string, body?: unknown): Promise<unknown> {
    const response = await this.request(method, path, body);
    if (response.status === 204) {
      return undefined;
    }
    const text = await response.text();
    return text.length > 0 ? JSON.parse(text) : undefined;
  }

  private async request(method: string, path: string, body?: unknown): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let response: Response;
    try {
      response = await this.fetchFn(`${this.baseUrl}${path}`, {
        method,
        headers: this.buildHeaders(body),
        body: toBody(body),
        signal: controller.signal,
      });
    } catch {
      this.monitor.reportFailure();
      throw ApiError.connectionFailure();
    } finally {
      clearTimeout(timer);
    }
    this.monitor.reportSuccess();
    if (!response.ok) {
      const error = await toApiError(response);
      this.onError?.(error);
      throw error;
    }
    return response;
  }

  private buildHeaders(body: unknown): Headers {
    const headers = new Headers({
      Accept: 'application/json',
      'X-Client-App': HttpApiClient.CLIENT_APP,
    });
    if (body !== undefined && !(body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    const token = this.session.getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }
}

function toBody(body: unknown): BodyInit | undefined {
  if (body === undefined) {
    return undefined;
  }
  return body instanceof FormData ? body : JSON.stringify(body);
}

async function toApiError(response: Response): Promise<ApiError> {
  const body: unknown = await response.json().catch(() => null);
  return ApiError.fromResponse(response.status, body);
}
