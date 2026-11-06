import { appConfig } from '../config/env';
import { SessionStore } from '../session/SessionStore';
import type { ApiError } from './ApiError';
import { ConnectionMonitor } from './ConnectionMonitor';
import { HttpApiClient } from './HttpApiClient';

type ApiErrorListener = (error: ApiError) => void;

const errorListeners = new Set<ApiErrorListener>();

/** I069: a sessão subscreve os erros da API para tratar o ERR-01 e o ERR-07 num único sítio. Devolve o cancelamento. */
export function onApiError(listener: ApiErrorListener): () => void {
  errorListeners.add(listener);
  return () => {
    errorListeners.delete(listener);
  };
}

/** Instâncias únicas usadas pela aplicação; os testes criam as suas. */
export const sessionStore = new SessionStore();
export const connectionMonitor = new ConnectionMonitor();
export const apiClient = new HttpApiClient({
  baseUrl: appConfig.apiBaseUrl,
  timeoutMs: appConfig.apiTimeoutMs,
  session: sessionStore,
  monitor: connectionMonitor,
  onError: (error) => errorListeners.forEach((listener) => listener(error)),
});
