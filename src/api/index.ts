import { appConfig } from '../config/env';
import { SessionStore } from '../session/SessionStore';
import { ConnectionMonitor } from './ConnectionMonitor';
import { HttpApiClient } from './HttpApiClient';

/** Instâncias únicas usadas pela aplicação; os testes criam as suas. */
export const sessionStore = new SessionStore();
export const connectionMonitor = new ConnectionMonitor();
export const apiClient = new HttpApiClient({
  baseUrl: appConfig.apiBaseUrl,
  timeoutMs: appConfig.apiTimeoutMs,
  session: sessionStore,
  monitor: connectionMonitor,
});
