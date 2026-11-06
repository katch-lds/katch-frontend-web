// Espelho dos DTOs e das enumerações da API v02 (documentação da API, secções 2.4, 4.1 e 8; modelo de classes do
// frontend web v02, secção 3).
export interface FieldErrorDto {
  field: string;
  reason: string;
}

export interface ApiErrorDto {
  code: string;
  message: string;
  fields: FieldErrorDto[];
  blockedUntil: string | null;
}

export type JobStatus = 'UNPUBLISHED' | 'PUBLISHED' | 'SUSPENDED' | 'CLOSED';

export type ConversationStatus = 'OPEN' | 'CLOSED';

export type ConversationCloseReason =
  'CLOSED_BY_PARTY' | 'ACCOUNT_BLOCKED_OR_SUSPENDED' | 'COMPANY_SUSPENDED';

export interface MatchDto {
  matchId: string;
  jobTitle: string;
  jobStatus: JobStatus;
  locationName: string;
  companyName: string;
  logoUrl: string | null;
  counterpartName: string;
  contactEmail: string;
  contactPhone: string;
  matchedAt: string;
}

export interface ConversationSummaryDto {
  matchId: string;
  counterpartName: string;
  jobTitle: string;
  companyName: string;
  status: ConversationStatus;
  closeReason: ConversationCloseReason | null;
  closedBy: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface MessageDto {
  messageId: string;
  senderId: string;
  content: string;
  sentAt: string;
  readAt: string | null;
}

export interface SendMessageRequest {
  content: string;
}

// I069 — autenticação, Empresa e listas de referência (API v02, secções 4.1, 6.1, 6.2 e 6.9).
export type UserType = 'CANDIDATE' | 'RECRUITER' | 'ADMIN';

export type CompanyStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export type Industry =
  | 'TECHNOLOGY'
  | 'HEALTHCARE'
  | 'RETAIL'
  | 'HOSPITALITY'
  | 'CONSTRUCTION'
  | 'MANUFACTURING'
  | 'EDUCATION'
  | 'FINANCE'
  | 'LOGISTICS'
  | 'SERVICES'
  | 'OTHER';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  userType: UserType;
  userId: string;
}

export interface CreateRecruiterAccountRequest {
  email: string;
  password: string;
  acceptTerms: boolean;
}

export interface CompanyRegistrationRequest {
  companyName: string;
  taxId: string;
  industry: Industry;
  address: string;
  locationId: string;
  contactEmail: string;
  contactPhone: string;
  responsibleName: string;
}

export interface CompanyStatusDto {
  companyId: string;
  status: CompanyStatus;
  rejectionReason: string | null;
  submittedAt: string;
}

export interface ReferenceItemDto {
  id: string;
  name: string;
}
