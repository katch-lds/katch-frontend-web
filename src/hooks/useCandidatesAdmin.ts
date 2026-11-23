import { useCallback } from 'react';
import { adminAccountService } from '../services';
import type { CandidateAdminDto } from '../types/api';
import { type IResourceState, reloadAfter, useResource } from './useResource';

const listCandidates = () => adminAccountService.listCandidates();

export interface CandidatesAdmin extends IResourceState<CandidateAdminDto[]> {
  activeCount: number;
  suspend: (candidateId: string) => Promise<void>;
  /** O `candidateId` é o identificador da conta (regra 9 da secção 5). */
  reactivate: (candidateId: string) => Promise<void>;
}

/**
 * Lista de Candidatos do Administrador (A08; RF088 a RF090).
 *
 * Conta os ativos («n Candidatos · m ativos») e lê a lista de novo depois de cada ação.
 *
 * @returns A lista, o número de ativos e as ações de suspender e reativar.
 */
export function useCandidatesAdmin(): CandidatesAdmin {
  const resource = useResource(listCandidates);
  const { data, reload } = resource;
  const activeCount = (data ?? []).filter((candidate) => candidate.status === 'ACTIVE').length;

  const suspend = useCallback(
    (candidateId: string) =>
      reloadAfter(() => adminAccountService.suspendCandidate(candidateId), reload),
    [reload],
  );

  const reactivate = useCallback(
    (candidateId: string) => reloadAfter(() => adminAccountService.reactivate(candidateId), reload),
    [reload],
  );

  return { ...resource, activeCount, suspend, reactivate };
}
