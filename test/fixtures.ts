import type {
  CandidateFullProfileDto,
  CompanyRegistrationDto,
  CompanyRegistrationRequest,
  CompanyStatusDto,
  ConversationSummaryDto,
  JobDto,
  LoginResponse,
  MatchDto,
  MessageDto,
  UserType,
  WaitingCandidateDto,
} from '../src/types/api';

// Dados fictícios dos testes (RI, secção 8.6): Recrutador «recruiter-1» e Candidata «candidate-1».
export const RECRUITER_ID = 'recruiter-1';
export const CANDIDATE_ID = 'candidate-1';

export function match(overrides: Partial<MatchDto> = {}): MatchDto {
  return {
    matchId: 'match-1',
    jobTitle: 'Empregado de mesa',
    jobStatus: 'PUBLISHED',
    locationName: 'Braga (Braga)',
    companyName: 'Café Central, Lda.',
    logoUrl: null,
    counterpartName: 'Ana Silva',
    contactEmail: 'ana.silva@exemplo.pt',
    contactPhone: '912345678',
    matchedAt: '2026-11-05T10:00:00+00:00',
    ...overrides,
  };
}

export function conversation(
  overrides: Partial<ConversationSummaryDto> = {},
): ConversationSummaryDto {
  return {
    matchId: 'match-1',
    counterpartName: 'Ana Silva',
    jobTitle: 'Empregado de mesa',
    companyName: 'Café Central, Lda.',
    status: 'OPEN',
    closeReason: null,
    closedBy: null,
    lastMessageAt: '2026-11-05T09:27:00+00:00',
    unreadCount: 0,
    ...overrides,
  };
}

export function message(
  id: string,
  sentAt: string,
  overrides: Partial<MessageDto> = {},
): MessageDto {
  return {
    messageId: id,
    senderId: CANDIDATE_ID,
    content: `Mensagem ${id}`,
    sentAt,
    readAt: null,
    ...overrides,
  };
}

export function loginResponse(
  userType: UserType = 'RECRUITER',
  overrides: Partial<LoginResponse> = {},
): LoginResponse {
  return {
    token: 'token-de-teste',
    expiresAt: '2999-01-01T08:00:00+00:00',
    userType,
    userId: userType === 'RECRUITER' ? RECRUITER_ID : 'admin-1',
    ...overrides,
  };
}

export function companyStatus(overrides: Partial<CompanyStatusDto> = {}): CompanyStatusDto {
  return {
    companyId: 'company-1',
    status: 'PENDING',
    rejectionReason: null,
    submittedAt: '2026-11-05T10:00:00+00:00',
    ...overrides,
  };
}

export function companyRegistration(
  overrides: Partial<CompanyRegistrationRequest> = {},
): CompanyRegistrationRequest {
  return {
    companyName: 'Café Central, Lda.',
    taxId: '123456789',
    industry: 'HOSPITALITY',
    address: 'Rua das Flores 10',
    locationId: 'loc-1',
    contactEmail: 'geral@cafecentral.pt',
    contactPhone: '253123456',
    responsibleName: 'Rui Costa',
    ...overrides,
  };
}

export function job(overrides: Partial<JobDto> = {}): JobDto {
  return {
    jobId: 'job-1',
    title: 'Empregado de mesa',
    description: 'Serviço de mesa e apoio ao balcão.',
    minSalary: 900,
    maxSalary: 1100,
    locationId: 'loc-1',
    locationName: 'Braga (Braga)',
    contractType: 'PERMANENT',
    workMode: 'ON_SITE',
    skills: [{ id: 'skill-1', name: 'Atendimento' }],
    benefits: [{ id: 'benefit-1', name: 'Refeição no local' }],
    isUrgent: false,
    expiresAt: '2026-11-30T23:59:59Z',
    status: 'PUBLISHED',
    publishedAt: '2026-11-05T10:00:00Z',
    photoUrls: [],
    waitingCandidates: 0,
    ...overrides,
  };
}

export function companyRegistrationDto(
  overrides: Partial<CompanyRegistrationDto> = {},
): CompanyRegistrationDto {
  return {
    ...companyRegistration(),
    companyId: 'company-1',
    locationName: 'Braga (Braga)',
    submittedAt: '2026-11-05T10:00:00+00:00',
    ...overrides,
  };
}

export function waitingCandidate(
  overrides: Partial<WaitingCandidateDto> = {},
): WaitingCandidateDto {
  return {
    matchId: 'match-1',
    candidateId: CANDIDATE_ID,
    fullName: 'Ana Ferreira',
    desiredRole: 'Programadora backend',
    locationName: 'Guimarães (Braga)',
    interestAt: '2026-10-09T15:12:40Z',
    ...overrides,
  };
}

export function candidateProfile(
  overrides: Partial<CandidateFullProfileDto> = {},
): CandidateFullProfileDto {
  return {
    matchId: 'match-1',
    fullName: 'Ana Ferreira',
    photoUrl: null,
    desiredRole: 'Programadora backend',
    locationName: 'Guimarães (Braga)',
    availability: 'ONE_MONTH',
    experienceSummary: 'Três anos de experiência em APIs.',
    links: ['https://github.com/ana'],
    skills: [
      { name: 'C#', matchesJob: true },
      { name: 'SQL', matchesJob: false },
    ],
    hasCv: false,
    profileOpenedAt: '2026-11-07T10:32:00Z',
    ...overrides,
  };
}
