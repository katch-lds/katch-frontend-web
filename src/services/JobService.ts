import type { IApiClient } from '../api/IApiClient';
import type { JobDto, JobRequest } from '../types/api';

// I070 — JobService (modelo de classes do frontend web v02, secção 5; documentação da API v02, 6.5).
export interface IJobService {
  list(): Promise<JobDto[]>;
  create(request: JobRequest): Promise<JobDto>;
  update(jobId: string, request: JobRequest): Promise<JobDto>;
  publish(jobId: string): Promise<JobDto>;
  suspend(jobId: string): Promise<JobDto>;
  republish(jobId: string): Promise<JobDto>;
  close(jobId: string): Promise<JobDto>;
  delete(jobId: string): Promise<void>;
  addPhoto(jobId: string, file: File): Promise<string | null>;
}

const BASE = '/api/recruiter/jobs';

function jobPath(jobId: string): string {
  return `${BASE}/${encodeURIComponent(jobId)}`;
}

/** Vagas da Empresa do Recrutador (JobsController; política ApprovedCompany). */
export class JobService implements IJobService {
  constructor(private readonly api: IApiClient) {}

  /** Vagas da própria Empresa, da mais recente para a mais antiga (6.5.1). */
  list(): Promise<JobDto[]> {
    return this.api.get<JobDto[]>(BASE);
  }

  /** Cria a vaga no estado não publicada (6.5.2). */
  create(request: JobRequest): Promise<JobDto> {
    return this.api.post<JobDto>(BASE, request);
  }

  /** Substitui os dados da vaga; uma vaga encerrada é rejeitada com 409 (6.5.3). */
  update(jobId: string, request: JobRequest): Promise<JobDto> {
    return this.api.put<JobDto>(jobPath(jobId), request);
  }

  publish(jobId: string): Promise<JobDto> {
    return this.api.post<JobDto>(`${jobPath(jobId)}/publish`);
  }

  suspend(jobId: string): Promise<JobDto> {
    return this.api.post<JobDto>(`${jobPath(jobId)}/suspend`);
  }

  republish(jobId: string): Promise<JobDto> {
    return this.api.post<JobDto>(`${jobPath(jobId)}/republish`);
  }

  close(jobId: string): Promise<JobDto> {
    return this.api.post<JobDto>(`${jobPath(jobId)}/close`);
  }

  /** Sem verificação prévia no cliente: com interesses registados, o servidor responde 409 ERR-38 (secção 5, regra 5). */
  delete(jobId: string): Promise<void> {
    return this.api.delete(jobPath(jobId));
  }

  /** Carrega uma fotografia (JPEG ou PNG até 5 MB) e devolve o endereço do cabeçalho Location (6.5.9). */
  addPhoto(jobId: string, file: File): Promise<string | null> {
    return this.api.upload('POST', `${jobPath(jobId)}/photos`, file);
  }
}
