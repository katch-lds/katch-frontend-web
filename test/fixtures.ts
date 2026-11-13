import type {
  AccountDto,
  CandidateAdminDto,
  CandidateFullProfileDto,
  CompanyAdminDto,
  CompanyPageDto,
  CompanyRegistrationDto,
  CompanyRegistrationRequest,
  CompanyStatusDto,
  ConversationSummaryDto,
  JobDto,
  LoginResponse,
  MatchDto,
  MessageDto,
  PendingCompanyDto,
  IndicatorsDto,
  PublishedJobAdminDto,
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

export function companyPageDto(overrides: Partial<CompanyPageDto> = {}): CompanyPageDto {
  return {
    companyId: 'company-1',
    companyName: 'Café Central, Lda.',
    description: 'Café e restaurante no centro de Braga.',
    website: 'https://www.cafecentral.pt',
    logoUrl: null,
    photoUrls: [],
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

// I073 — supervisão (dados fictícios).
export function pendingCompany(overrides: Partial<PendingCompanyDto> = {}): PendingCompanyDto {
  return {
    companyId: 'company-1',
    companyName: 'Lumen Software, Lda.',
    taxId: '509123456',
    submittedAt: '2026-10-05T10:00:00Z',
    ...overrides,
  };
}

export function companyAdmin(overrides: Partial<CompanyAdminDto> = {}): CompanyAdminDto {
  return {
    companyId: 'company-1',
    companyName: 'Lumen Software, Lda.',
    status: 'APPROVED',
    publishedJobs: 4,
    ...overrides,
  };
}

export function publishedJob(
  index = 1,
  overrides: Partial<PublishedJobAdminDto> = {},
): PublishedJobAdminDto {
  return {
    jobId: `job-${index}`,
    title: `Programador Backend .NET ${index}`,
    companyName: 'Lumen Software, Lda.',
    publishedAt: '2026-10-09T15:00:00Z',
    interestCount: 3,
    ...overrides,
  };
}

export function account(overrides: Partial<AccountDto> = {}): AccountDto {
  return {
    userId: 'user-1',
    email: 'ana.ferreira@exemplo.pt',
    userType: 'CANDIDATE',
    status: 'ACTIVE',
    ...overrides,
  };
}

export function candidateAdmin(overrides: Partial<CandidateAdminDto> = {}): CandidateAdminDto {
  return {
    candidateId: 'candidate-1',
    fullName: 'Ana Ferreira',
    email: 'ana.ferreira@exemplo.pt',
    locationName: 'Guimarães (Braga)',
    registeredAt: '2026-10-09T14:30:00Z',
    status: 'ACTIVE',
    ...overrides,
  };
}

export function indicators(overrides: Partial<IndicatorsDto> = {}): IndicatorsDto {
  return {
    activeCandidates: 24,
    approvedCompanies: 5,
    pendingCompanies: 2,
    jobsFirstPublished: 51,
    interestsExpressed: 87,
    matchesConfirmed: 12,
    conversationsStarted: 9,
    ...overrides,
  };
}
