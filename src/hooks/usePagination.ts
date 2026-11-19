import { useCallback, useMemo, useState } from 'react';

/** Linhas por página das listas do Administrador (A06 e A07). */
export const ADMIN_PAGE_SIZE = 12;

export interface Pagination<T> {
  /** Página atual, a partir de 1. */
  page: number;
  pageCount: number;
  visibleRows: T[];
  goToPage: (page: number) => void;
}

/**
 * Paginação no cliente sobre a lista completa devolvida pela API (A06 e A07; API v02, secção 11, L-02).
 *
 * A página pedida fica sempre entre 1 e a última, mesmo que a lista encolha depois de uma nova leitura.
 *
 * @param rows Lista completa.
 * @param pageSize Linhas por página.
 * @returns A página atual, o número de páginas, as linhas visíveis e `goToPage`.
 */
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
