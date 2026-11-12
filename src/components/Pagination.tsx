// I073 — paginação com «Anterior» e «Seguinte» (modelo de classes do frontend web v02, secção 8.1: DataTable; A06 e A07).

interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

/** Não aparece quando a lista cabe numa só página. */
export function Pagination({ page, pageCount, onPageChange }: Readonly<PaginationProps>) {
  if (pageCount <= 1) {
    return null;
  }
  return (
    <nav className="pagination" aria-label="Paginação">
      <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Anterior
      </button>
      <span>
        Página {page} de {pageCount}
      </span>
      <button type="button" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
        Seguinte
      </button>
    </nav>
  );
}
