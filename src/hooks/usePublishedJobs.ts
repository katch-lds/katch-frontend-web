import { useMemo } from 'react';
import { adminCompanyService } from '../services';
import type { PublishedJobAdminDto } from '../types/api';
import { type Pagination, usePagination } from './usePagination';
import { type IResourceState, useResource } from './useResource';

// I073 — lista global de vagas publicadas (A06; RF098), paginada no cliente com 12 linhas.

const listPublishedJobs = () => adminCompanyService.listPublishedJobs();

export type PublishedJobs = IResourceState<PublishedJobAdminDto[]> &
  Pagination<PublishedJobAdminDto>;

export function usePublishedJobs(): PublishedJobs {
  const resource = useResource(listPublishedJobs);
  const rows = useMemo(() => resource.data ?? [], [resource.data]);
  return { ...resource, ...usePagination(rows) };
}
