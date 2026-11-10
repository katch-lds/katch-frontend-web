import { useCallback } from 'react';
import { ApiError } from '../api/ApiError';
import { companyService, jobService, referenceListService } from '../services';
import type { CompanyRegistrationDto, JobDto, ReferenceItemDto } from '../types/api';
import { type IResourceState, useResource } from './useResource';

// I070 — dados do formulário da vaga (W10 e W11): listas pré-definidas, vaga a alterar e localidade da Empresa.

export interface JobFormData {
  /** Vaga a alterar; null na criação. */
  job: JobDto | null;
  skills: ReferenceItemDto[];
  benefits: ReferenceItemDto[];
  locations: ReferenceItemDto[];
  /** Localidade proposta por omissão na criação (RF050); null se não for possível obtê-la. */
  companyLocationId: string | null;
}

/** A API não tem consulta de uma vaga: a vaga é procurada na lista da própria Empresa (6.5.1). */
async function findJob(jobId: string): Promise<JobDto> {
  const job = (await jobService.list()).find((item) => item.jobId === jobId);
  if (job === undefined) {
    throw new ApiError(404, 'A vaga não existe ou já foi eliminada.', 'ERR-20');
  }
  return job;
}

/** Sem a localidade da Empresa, o formulário abre com a localidade por escolher. */
function companyLocation(registration: Promise<CompanyRegistrationDto | null>) {
  return registration.then(
    (value) => value?.locationId ?? null,
    () => null,
  );
}

/** Pede tudo ao abrir o formulário; `reload` lê de novo a vaga (por exemplo, depois de carregar fotografias). */
export function useJobFormData(jobId: string | null): IResourceState<JobFormData> {
  const load = useCallback(async (): Promise<JobFormData> => {
    const [job, skills, benefits, locations, companyLocationId] = await Promise.all([
      jobId === null ? Promise.resolve(null) : findJob(jobId),
      referenceListService.listSkills(),
      referenceListService.listBenefits(),
      referenceListService.listLocations(),
      jobId === null ? companyLocation(companyService.getRegistration()) : Promise.resolve(null),
    ]);
    return { job, skills, benefits, locations, companyLocationId };
  }, [jobId]);
  return useResource(load);
}
