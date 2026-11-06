import type { IApiClient } from '../api/IApiClient';
import type { MatchDto } from '../types/api';

/** Matches da Empresa do Recrutador (MatchesController; API v02, 6.7). */
export class MatchService {
  constructor(private readonly api: IApiClient) {}

  list(): Promise<MatchDto[]> {
    return this.api.get<MatchDto[]>('/api/matches');
  }
}
