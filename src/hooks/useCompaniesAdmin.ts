import { useCallback, useMemo, useState } from 'react';
import { adminCompanyService } from '../services';
import type { CompanyAdminDto, CompanyStatus } from '../types/api';
import { type IResourceState, useResource } from './useResource';

// I073 — lista global de Empresas (A05; RF097): filtro por estado e nova leitura depois de cada mudança de estado.

const listCompanies = () => adminCompanyService.listCompanies();

export interface CompaniesAdmin extends IResourceState<CompanyAdminDto[]> {
  /** null mostra todas as Empresas. */
  statusFilter: CompanyStatus | null;
  visibleRows: CompanyAdminDto[];
  filterByStatus: (status: CompanyStatus | null) => void;
  suspend: (companyId: string) => Promise<void>;
  reactivate: (companyId: string) => Promise<void>;
}

export function useCompaniesAdmin(): CompaniesAdmin {
  const resource = useResource(listCompanies);
  const [statusFilter, setStatusFilter] = useState<CompanyStatus | null>(null);
  const { data, reload } = resource;

  const visibleRows = useMemo(
    () =>
      (data ?? []).filter((company) => statusFilter === null || company.status === statusFilter),
    [data, statusFilter],
  );

  const suspend = useCallback(
    async (companyId: string) => {
      try {
        await adminCompanyService.suspend(companyId);
      } finally {
        reload();
      }
    },
    [reload],
  );

  const reactivate = useCallback(
    async (companyId: string) => {
      try {
        await adminCompanyService.reactivate(companyId);
      } finally {
        reload();
      }
    },
    [reload],
  );

  return {
    ...resource,
    statusFilter,
    visibleRows,
    filterByStatus: setStatusFilter,
    suspend,
    reactivate,
  };
}
