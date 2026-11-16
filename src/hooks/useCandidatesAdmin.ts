import { useCallback } from 'react';
import { adminAccountService } from '../services';
import type { CandidateAdminDto } from '../types/api';
import { type IResourceState, useResource } from './useResource';

// I073 — lista de Candidatos (A08; RF088 a RF090): «n Candidatos · m ativos» e nova leitura depois de cada ação.

const listCandidates = () => adminAccountService.listCandidates();

export interface CandidatesAdmin extends IResourceState<CandidateAdminDto[]> {
  activeCount: number;
  suspend: (candidateId: string) => Promise<void>;
  /** O `candidateId` é o identificador da conta (regra 9 da secção 5). */
  reactivate: (candidateId: string) => Promise<void>;
}

export function useCandidatesAdmin(): CandidatesAdmin {
  const resource = useResource(listCandidates);
  const { data, reload } = resource;
  const activeCount = (data ?? []).filter((candidate) => candidate.status === 'ACTIVE').length;

  const suspend = useCallback(
    async (candidateId: string) => {
      try {
        await adminAccountService.suspendCandidate(candidateId);
      } finally {
        reload();
      }
    },
    [reload],
  );

  const reactivate = useCallback(
    async (candidateId: string) => {
      try {
        await adminAccountService.reactivate(candidateId);
      } finally {
        reload();
      }
    },
    [reload],
  );

  return { ...resource, activeCount, suspend, reactivate };
}
