import { jobService } from '../services';
import type { JobDto } from '../types/api';
import { type IResourceState, useResource } from './useResource';

const listJobs = () => jobService.list();

/** Vagas da Empresa, pedidas ao abrir o ecrã (mínimo da I071: só a lista). */
export function useJobs(): IResourceState<JobDto[]> {
  return useResource(listJobs);
}
