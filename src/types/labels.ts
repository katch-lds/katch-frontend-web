import type {
  CompanyStatus,
  ContractType,
  ConversationCloseReason,
  Industry,
  JobStatus,
  WorkMode,
} from './api';

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

export const industryLabels: Record<Industry, string> = {
  TECHNOLOGY: 'Tecnologia',
  HEALTHCARE: 'Saúde',
  RETAIL: 'Comércio',
  HOSPITALITY: 'Hotelaria e restauração',
  CONSTRUCTION: 'Construção',
  MANUFACTURING: 'Indústria',
  EDUCATION: 'Educação',
  FINANCE: 'Finanças',
  LOGISTICS: 'Logística',
  SERVICES: 'Serviços',
  OTHER: 'Outro',
};

export const companyStatusLabels: Record<CompanyStatus, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovada',
  REJECTED: 'Recusada',
  SUSPENDED: 'Suspensa',
};

// I070 — tipo de contrato e regime de trabalho da vaga (RF050).
export const contractTypeLabels: Record<ContractType, string> = {
  PERMANENT: 'Sem termo',
  FIXED_TERM: 'A termo',
  INTERNSHIP: 'Estágio',
  SERVICE_PROVISION: 'Prestação de serviços',
};

export const workModeLabels: Record<WorkMode, string> = {
  ON_SITE: 'Presencial',
  HYBRID: 'Híbrido',
  REMOTE: 'Remoto',
};
