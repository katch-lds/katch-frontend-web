import type { IApiClient } from '../api/IApiClient';
import type { JobDto } from '../types/api';

/** Vagas da Empresa do Recrutador (JobsController; API v02, 6.5). Aqui só a listagem; as ações de vaga são da I070. */
export class JobService {
  constructor(private readonly api: IApiClient) {}

  list(): Promise<JobDto[]> {
    return this.api.get<JobDto[]>('/api/recruiter/jobs');
  }
}
