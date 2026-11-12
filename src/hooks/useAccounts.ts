import { useCallback, useMemo, useState } from 'react';
import { adminAccountService } from '../services';
import type { AccountDto, AccountStatus, UserType } from '../types/api';
import { type Pagination, usePagination } from './usePagination';
import { type IResourceState, useResource } from './useResource';

// I073 — contas de utilizador (A07; RF085 a RF087): pesquisa por correio eletrónico, filtros por tipo e estado,
// paginação de 12 linhas e nova leitura depois de cada ação.

const listAccounts = () => adminAccountService.listAccounts();

export interface Accounts extends IResourceState<AccountDto[]>, Pagination<AccountDto> {
  emailQuery: string;
  /** null mostra todos os tipos. */
  typeFilter: UserType | null;
  /** null mostra todos os estados. */
  statusFilter: AccountStatus | null;
  search: (email: string) => void;
  filter: (type: UserType | null, status: AccountStatus | null) => void;
  block: (userId: string) => Promise<void>;
  reactivate: (userId: string) => Promise<void>;
}

export function useAccounts(): Accounts {
  const resource = useResource(listAccounts);
  const [emailQuery, setEmailQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<UserType | null>(null);
  const [statusFilter, setStatusFilter] = useState<AccountStatus | null>(null);
  const { data, reload } = resource;

  const filtered = useMemo(() => {
    const query = emailQuery.trim().toLowerCase();
    return (data ?? []).filter(
      (account) =>
        (query === '' || account.email.toLowerCase().includes(query)) &&
        (typeFilter === null || account.userType === typeFilter) &&
        (statusFilter === null || account.status === statusFilter),
    );
  }, [data, emailQuery, typeFilter, statusFilter]);
  const pagination = usePagination(filtered);
  const { goToPage } = pagination;

  const search = useCallback(
    (email: string) => {
      setEmailQuery(email);
      goToPage(1);
    },
    [goToPage],
  );

  const filter = useCallback(
    (type: UserType | null, status: AccountStatus | null) => {
      setTypeFilter(type);
      setStatusFilter(status);
      goToPage(1);
    },
    [goToPage],
  );

  const block = useCallback(
    async (userId: string) => {
      try {
        await adminAccountService.block(userId);
      } finally {
        reload();
      }
    },
    [reload],
  );

  const reactivate = useCallback(
    async (userId: string) => {
      try {
        await adminAccountService.reactivate(userId);
      } finally {
        reload();
      }
    },
    [reload],
  );

  return {
    ...resource,
    ...pagination,
    emailQuery,
    typeFilter,
    statusFilter,
    search,
    filter,
    block,
    reactivate,
  };
}
