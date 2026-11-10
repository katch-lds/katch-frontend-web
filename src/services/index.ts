import { apiClient } from '../api';
import { AuthService } from './AuthService';
import { CandidateEvaluationService } from './CandidateEvaluationService';
import { CompanyService } from './CompanyService';
import { ConversationService } from './ConversationService';
import { JobService } from './JobService';
import { MatchService } from './MatchService';
import { ReferenceListService } from './ReferenceListService';

/** Instâncias únicas dos serviços, partilhadas pelos hooks (modelo de classes do frontend web v02, secção 9). */
export const matchService = new MatchService(apiClient);
export const conversationService = new ConversationService(apiClient);
export const authService = new AuthService(apiClient);
export const companyService = new CompanyService(apiClient);
export const referenceListService = new ReferenceListService(apiClient);
export const jobService = new JobService(apiClient);
export const candidateEvaluationService = new CandidateEvaluationService(apiClient);
