import { useMemo } from 'react';
import { adminCompanyService } from '../services';
import type { PublishedJobAdminDto } from '../types/api';
import { type Pagination, usePagination } from './usePagination';
import { type IResourceState, useResource } from './useResource';

const listPublishedJobs = () => adminCompanyService.listPublishedJobs();

export type PublishedJobs = IResourceState<PublishedJobAdminDto[]> &
  Pagination<PublishedJobAdminDto>;

/**
 * Lista global de vagas publicadas (A06; RF098).
 *
 * Paginada no cliente com 12 linhas.
 *
 * @returns A página visível das vagas, a paginação, o estado de carregamento e `reload`.
 */
export function usePublishedJobs(): PublishedJobs {
  const resource = useResource(listPublishedJobs);
  const rows = useMemo(() => resource.data ?? [], [resource.data]);
  return { ...resource, ...usePagination(rows) };
}
