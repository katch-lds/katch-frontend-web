/**
 * Parâmetros da consulta periódica.
 *
 * Num único sítio (modelo de classes do frontend web v02, secção 6; P17).
 *
 * @returns `pollingConfig`, com o intervalo entre as consultas das conversas.
 */
export const pollingConfig = {
  /** Intervalo entre as consultas da lista de conversas e da conversa aberta (deliberação 1 da ata de 2026-10-16). */
  conversationsIntervalMs: 3000,
} as const;
