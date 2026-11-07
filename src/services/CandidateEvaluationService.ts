import type { IApiClient } from '../api/IApiClient';
import type { CandidateFullProfileDto, MatchDto, WaitingCandidateDto } from '../types/api';

/** Avaliação de candidatos (CandidateEvaluationController; API v02, 6.6): lista, perfil, CV e decisão. */
export class CandidateEvaluationService {
  constructor(private readonly api: IApiClient) {}

  listWaiting(jobId: string): Promise<WaitingCandidateDto[]> {
    return this.api.get<WaitingCandidateDto[]>(
      `/api/recruiter/jobs/${encodeURIComponent(jobId)}/waiting-candidates`,
    );
  }

  /** Tem efeito no servidor: na primeira chamada regista a abertura do perfil (RF118; idempotente). */
  openProfile(matchId: string): Promise<CandidateFullProfileDto> {
    return this.api.get<CandidateFullProfileDto>(`${this.interestPath(matchId)}/profile`);
  }

  getCv(matchId: string): Promise<Blob> {
    return this.api.getFile(`${this.interestPath(matchId)}/cv`);
  }

  /** Sem corpo: o Recrutador vem da credencial (RNF006). */
  accept(matchId: string): Promise<MatchDto> {
    return this.api.post<MatchDto>(`${this.interestPath(matchId)}/accept`);
  }

  async reject(matchId: string): Promise<void> {
    await this.api.post<void>(`${this.interestPath(matchId)}/reject`);
  }

  private interestPath(matchId: string): string {
    return `/api/recruiter/interests/${encodeURIComponent(matchId)}`;
  }
}
