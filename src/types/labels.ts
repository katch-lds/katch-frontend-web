import type { ConversationCloseReason, JobStatus } from './api';

// Mapa único das designações em português das enumerações (modelo de classes do frontend web v02, secção 3.1).
export const jobStatusLabels: Record<JobStatus, string> = {
  UNPUBLISHED: 'Não publicada',
  PUBLISHED: 'Publicada',
  SUSPENDED: 'Suspensa',
  CLOSED: 'Encerrada',
};

export const conversationCloseReasonLabels: Record<ConversationCloseReason, string> = {
  CLOSED_BY_PARTY: 'Encerrada por uma das partes',
  ACCOUNT_BLOCKED_OR_SUSPENDED: 'Conta bloqueada ou suspensa',
  COMPANY_SUSPENDED: 'Empresa suspensa',
};
