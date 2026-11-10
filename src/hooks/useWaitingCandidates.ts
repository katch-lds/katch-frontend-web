import { useCallback } from 'react';
import { candidateEvaluationService } from '../services';
import type { WaitingCandidateDto } from '../types/api';
import { type IResourceState, useResource } from './useResource';

/** Candidatos em espera de uma vaga (W16; RF060). Ao mudar de vaga repete o pedido e descarta a resposta anterior. */
export function useWaitingCandidates(jobId: string): IResourceState<WaitingCandidateDto[]> {
  const load = useCallback(() => candidateEvaluationService.listWaiting(jobId), [jobId]);
  return useResource(load);
}
