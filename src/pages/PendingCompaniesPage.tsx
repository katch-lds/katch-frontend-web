import { useLocation, useNavigate } from 'react-router';
import { type Column, DataTable } from '../components/DataTable';
import { ErrorAlert } from '../components/ErrorAlert';
import { usePendingCompanies } from '../hooks/usePendingCompanies';
import { adminPendingPath, paths } from '../routes/paths';
import type { PendingCompanyDto } from '../types/api';
import { formatDate } from '../utils/date';
import './admin.css';
import './recruiter.css';

// I073 — PendingCompaniesPage (modelo de classes do frontend web v02, secção 8.3; ecrãs A03, A03b, A03c e A03d do
// protótipo v02).

/** A03 — Empresas pendentes, das mais antigas para as mais recentes, como a API as devolve (RF043, RF091). */
export default function PendingCompaniesPage() {
  const { data, loading, error, reload } = usePendingCompanies();
  const navigate = useNavigate();
  // A03b e A03c: a mensagem da decisão chega com a navegação do detalhe; não refere aviso ao Recrutador.
  const notice = (useLocation().state as { notice?: string } | null)?.notice ?? null;

  const columns: Column<PendingCompanyDto>[] = [
    { key: 'name', header: 'Designação social', render: (c) => <strong>{c.companyName}</strong> },
    { key: 'taxId', header: 'NIF', render: (c) => c.taxId },
    { key: 'submittedAt', header: 'Data de submissão', render: (c) => formatDate(c.submittedAt) },
    {
      key: 'action',
      header: 'Ação',
      render: (c) => (
        <button type="button" onClick={() => void navigate(adminPendingPath(c.companyId))}>
          Abrir registo
        </button>
      ),
    },
  ];

  return (
    <section className="recruiter-page admin-page">
      <h1>Empresas pendentes de aprovação</h1>
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      {loading && !data && <p>A carregar as Empresas pendentes…</p>}
      {error && <ErrorAlert error={error} onRetry={reload} />}
      {data?.length === 0 && (
        <>
          <p className="empty-state">Não há Empresas a aguardar aprovação.</p>
          <button type="button" onClick={() => void navigate(paths.adminCompanies)}>
            Ver todas as Empresas
          </button>
        </>
      )}
      {data && data.length > 0 && (
        <DataTable
          columns={columns}
          rows={data}
          rowKey={(c) => c.companyId}
          emptyMessage="Não há Empresas a aguardar aprovação."
        />
      )}
    </section>
  );
}
