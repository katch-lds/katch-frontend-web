import { jobService } from '../services';
import type { JobDto } from '../types/api';
import { type IResourceState, useResource } from './useResource';

const listJobs = () => jobService.list();

/**
 * Vagas da própria Empresa (W09; RF059).
 *
 * Pedidas ao abrir o ecrã e depois de cada mudança de estado.
 *
 * @returns As vagas, o estado de carregamento e `reload`.
 */
export function useJobs(): IResourceState<JobDto[]> {
  return useResource(listJobs);
}
