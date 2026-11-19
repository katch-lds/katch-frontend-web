import { appConfig } from '../config/env';
import { SessionStore } from '../session/SessionStore';
import type { ApiError } from './ApiError';
import { HttpApiClient } from './HttpApiClient';

type ApiErrorListener = (error: ApiError) => void;

const errorListeners = new Set<ApiErrorListener>();

/** A sessão subscreve os erros da API para tratar o ERR-01 e o ERR-07 num único sítio; devolve o cancelamento. */
export function onApiError(listener: ApiErrorListener): () => void {
  errorListeners.add(listener);
  return () => {
    errorListeners.delete(listener);
  };
}

/** Entrega o erro a quem subscreveu (usado pelo cliente da API e pelos testes). */
export function notifyApiError(error: ApiError): void {
  errorListeners.forEach((listener) => listener(error));
}

/** Instâncias únicas usadas pela aplicação; os testes criam as suas. */
export const sessionStore = new SessionStore();
export const apiClient = new HttpApiClient({
  baseUrl: appConfig.apiBaseUrl,
  timeoutMs: appConfig.apiTimeoutMs,
  session: sessionStore,
  onError: notifyApiError,
});
