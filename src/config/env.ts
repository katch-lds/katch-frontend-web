// Configuração por ambiente (I120). Os valores vêm dos ficheiros .env.* do Vite (VITE_*), sem segredos.
export interface AppConfig {
  /** Endereço base da API REST, sem a barra final (por exemplo, http://localhost:5180). */
  apiBaseUrl: string;
  /** Tempo limite de cada pedido, inferior a 10 segundos (RNF018). */
  apiTimeoutMs: number;
}

const DEFAULT_TIMEOUT_MS = 9000;

function readTimeout(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 && parsed < 10000 ? parsed : DEFAULT_TIMEOUT_MS;
}

export const appConfig: AppConfig = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, ''),
  apiTimeoutMs: readTimeout(import.meta.env.VITE_API_TIMEOUT_MS),
};
