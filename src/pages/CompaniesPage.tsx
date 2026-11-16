import { useId } from 'react';
import { useNavigate } from 'react-router';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { type Column, DataTable } from '../components/DataTable';
import { ErrorAlert } from '../components/ErrorAlert';
import { StatusBadge } from '../components/StatusBadge';
import { useActionConfirmation } from '../hooks/useActionConfirmation';
import { useCompaniesAdmin } from '../hooks/useCompaniesAdmin';
import { adminPendingPath } from '../routes/paths';
import type { CompanyAdminDto, CompanyStatus } from '../types/api';
import { companyStatusLabels } from '../types/labels';
import './admin.css';
import './recruiter.css';

// I073 — CompaniesPage (modelo de classes do frontend web v02, secção 8.3; ecrãs A05 e A05b do protótipo v02).

type CompanyAction = 'suspend' | 'reactivate';

interface PendingAction {
  company: CompanyAdminDto;
  action: CompanyAction;
}

const actionTexts: Record<CompanyAction, { title: string; effects: string; done: string }> = {
  suspend: {
    title: 'Suspender Empresa',
    effects:
      'As vagas da Empresa deixam de ser apresentadas aos Candidatos, as conversas abertas passam a modo apenas de consulta e o Recrutador deixa de poder usar as funções que exigem a Empresa aprovada.',
    done: 'suspensa',
  },
  reactivate: {
    title: 'Reativar Empresa',
    effects:
      'A Empresa volta a ser aprovada. As conversas encerradas pela suspensão mantêm-se em modo apenas de consulta.',
    done: 'reativada',
  },
};

const statusFilters: CompanyStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];

/**
 * A05 — todas as Empresas, com filtro por estado e a ação que a API admite em cada estado: «Decidir» (pendente),
 * «Suspender» (aprovada) e «Reativar» (suspensa) (RF095, RF097, RF116). A recusada não tem ações.
 */
export default function CompaniesPage() {
  const companies = useCompaniesAdmin();
  const action = useActionConfirmation<PendingAction>();
  const navigate = useNavigate();
  const filterId = useId();

  const run = ({ company, action: kind }: PendingAction) => {
    const operation = kind === 'suspend' ? companies.suspend : companies.reactivate;
    return action.confirm(
      () => operation(company.companyId),
      `Empresa «${company.companyName}» ${actionTexts[kind].done}.`,
    );
  };

  const columns: Column<CompanyAdminDto>[] = [
    { key: 'name', header: 'Designação social', render: (c) => <strong>{c.companyName}</strong> },
    { key: 'status', header: 'Estado', render: (c) => <StatusBadge status={c.status} /> },
    { key: 'jobs', header: 'Vagas publicadas', render: (c) => c.publishedJobs },
    {
      key: 'actions',
      header: 'Ações',
      render: (c) => (
        <div className="row-actions">
          {c.status === 'PENDING' && (
            <button type="button" onClick={() => void navigate(adminPendingPath(c.companyId))}>
              Decidir
            </button>
          )}
          {c.status === 'APPROVED' && (
            <button type="button" onClick={() => action.request({ company: c, action: 'suspend' })}>
              Suspender
            </button>
          )}
          {c.status === 'SUSPENDED' && (
            <button
              type="button"
              onClick={() => action.request({ company: c, action: 'reactivate' })}
            >
              Reativar
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <section className="recruiter-page admin-page">
      <h1>Empresas</h1>
      {action.notice && (
        <p role="status" className="notice">
          {action.notice}
        </p>
      )}
      {action.failure && <ErrorAlert error={action.failure} onRetry={companies.reload} />}
      {companies.loading && !companies.data && <p>A carregar as Empresas…</p>}
      {companies.error && <ErrorAlert error={companies.error} onRetry={companies.reload} />}
      {companies.data && (
        <>
          <div className="toolbar">
            <div className="form-field">
              <label htmlFor={filterId}>Estado</label>
              <select
                id={filterId}
                value={companies.statusFilter ?? ''}
                onChange={(event) =>
                  companies.filterByStatus((event.target.value || null) as CompanyStatus | null)
                }
              >
                <option value="">Todos os estados</option>
                {statusFilters.map((status) => (
                  <option key={status} value={status}>
                    {companyStatusLabels[status]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DataTable
            columns={columns}
            rows={companies.visibleRows}
            rowKey={(c) => c.companyId}
            emptyMessage="Não há Empresas com o estado escolhido."
          />
        </>
      )}
      {action.pending && (
        <ConfirmDialog
          title={actionTexts[action.pending.action].title}
          confirmLabel={action.pending.action === 'suspend' ? 'Suspender' : 'Reativar'}
          busy={action.busy}
          onConfirm={() => void run(action.pending as PendingAction)}
          onCancel={action.cancel}
        >
          <p>
            Empresa «{action.pending.company.companyName}».{' '}
            {actionTexts[action.pending.action].effects}
          </p>
        </ConfirmDialog>
      )}
    </section>
  );
}
