import type { IApiClient } from '../api/IApiClient';
import type { WaitingCandidateDto } from '../types/api';

/** Avaliação de candidatos (CandidateEvaluationController; API v02, 6.6). Aqui só a lista em espera; o resto é da I072. */
export class CandidateEvaluationService {
  constructor(private readonly api: IApiClient) {}

  listWaiting(jobId: string): Promise<WaitingCandidateDto[]> {
    return this.api.get<WaitingCandidateDto[]>(
      `/api/recruiter/jobs/${encodeURIComponent(jobId)}/waiting-candidates`,
    );
  }
}
