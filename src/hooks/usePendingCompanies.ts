import { useCallback, useEffect } from 'react';
import { ApiError } from '../api/ApiError';
import { adminCompanyService } from '../services';
import type { CompanyRegistrationDto, PendingCompanyDto, RejectCompanyRequest } from '../types/api';
import { type IResourceState, useResource } from './useResource';

const listPending = () => adminCompanyService.listPending();

/** Instâncias montadas: uma decisão atualiza a lista, o contador da barra lateral e a faixa dos indicadores. */
const reloaders = new Set<() => void>();

function reloadAll(): void {
  reloaders.forEach((reload) => reload());
}

export interface PendingCompanies extends IResourceState<PendingCompanyDto[]> {
  /** Dados submetidos da Empresa pedida em `companyId`; null enquanto carrega, em erro ou sem identificador. */
  selected: CompanyRegistrationDto | null;
  selectedLoading: boolean;
  selectedError: ApiError | null;
  reloadSelected: () => void;
  /** Aprova o registo (RF093); falha com o ApiError do servidor (por exemplo, 409 ERR-30). */
  approve: (companyId: string) => Promise<void>;
  /** Recusa o registo com motivo (RF094); falha com o ApiError do servidor (400 ERR-10, 409 ERR-30). */
  reject: (companyId: string, request: RejectCompanyRequest) => Promise<void>;
}

/**
 * Empresas pendentes (A03), dados submetidos da Empresa aberta (A04) e decisões (RF091 a RF094).
 *
 * Também serve o contador da barra lateral e a faixa dos indicadores. Depois de cada decisão, certa ou falhada,
 * todas as instâncias montadas leem a lista de novo: o servidor é a fonte de verdade.
 *
 * @param companyId Empresa cujos dados submetidos se abrem; null só lê a lista.
 * @returns A lista, os dados da Empresa aberta e as ações de aprovar e recusar.
 */
export function usePendingCompanies(companyId: string | null = null): PendingCompanies {
  const list = useResource(listPending);
  const loadSelected = useCallback(
    () =>
      companyId === null ? Promise.resolve(null) : adminCompanyService.getSubmittedData(companyId),
    [companyId],
  );
  const selected = useResource<CompanyRegistrationDto | null>(loadSelected);
  const { reload } = list;

  useEffect(() => {
    reloaders.add(reload);
    return () => {
      reloaders.delete(reload);
    };
  }, [reload]);

  const approve = useCallback(async (id: string) => {
    try {
      await adminCompanyService.approve(id);
    } finally {
      reloadAll();
    }
  }, []);

  const reject = useCallback(async (id: string, request: RejectCompanyRequest) => {
    try {
      await adminCompanyService.reject(id, request);
    } finally {
      reloadAll();
    }
  }, []);

  return {
    ...list,
    selected: selected.data,
    selectedLoading: selected.loading,
    selectedError: selected.error,
    reloadSelected: selected.reload,
    approve,
    reject,
  };
}
