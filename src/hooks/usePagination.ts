import { useCallback, useMemo, useState } from 'react';

// I073 — paginação no cliente sobre a lista completa devolvida pela API (modelo de classes do frontend web v02,
// secção 8.1: DataTable; documentação da API v02, secção 11, L-02).

/** Linhas por página das listas do Administrador (A06 e A07). */
export const ADMIN_PAGE_SIZE = 12;

export interface Pagination<T> {
  /** Página atual, a partir de 1. */
  page: number;
  pageCount: number;
  visibleRows: T[];
  goToPage: (page: number) => void;
}

/** A página pedida fica sempre entre 1 e a última, mesmo que a lista encolha depois de uma nova leitura. */
export function usePagination<T>(rows: T[], pageSize: number = ADMIN_PAGE_SIZE): Pagination<T> {
  const [requested, setRequested] = useState(1);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const page = Math.min(Math.max(1, requested), pageCount);
  const visibleRows = useMemo(
    () => rows.slice((page - 1) * pageSize, page * pageSize),
    [rows, page, pageSize],
  );
  const goToPage = useCallback((next: number) => setRequested(next), []);
  return { page, pageCount, visibleRows, goToPage };
}
