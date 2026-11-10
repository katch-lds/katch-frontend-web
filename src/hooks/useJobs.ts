import { jobService } from '../services';
import type { JobDto } from '../types/api';
import { type IResourceState, useResource } from './useResource';

const listJobs = () => jobService.list();

/** Vagas da própria Empresa, pedidas ao abrir o ecrã e depois de cada mudança de estado (W09; RF059). */
export function useJobs(): IResourceState<JobDto[]> {
  return useResource(listJobs);
}
