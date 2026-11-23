import { useId } from 'react';
import { useNavigate } from 'react-router';
import { ActionFeedback } from '../components/ActionFeedback';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { type Column, DataTable } from '../components/DataTable';
import { ErrorAlert } from '../components/ErrorAlert';
import { optionsOf, SelectField } from '../components/SelectField';
import { StatusBadge } from '../components/StatusBadge';
import { useActionConfirmation } from '../hooks/useActionConfirmation';
import { useCompaniesAdmin } from '../hooks/useCompaniesAdmin';
import { adminPendingPath } from '../routes/paths';
import type { CompanyAdminDto, CompanyStatus } from '../types/api';
import { companyStatusLabels } from '../types/labels';
import './admin.css';
import './recruiter.css';

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

const statusOptions = optionsOf(companyStatusLabels);

/**
 * A05 — todas as Empresas, com filtro por estado e a ação que a API admite em cada estado: «Decidir» (pendente),
 * «Suspender» (aprovada) e «Reativar» (suspensa) (RF095, RF097, RF116). A recusada não tem ações.
 */
export default function CompaniesPage() {
  const companies = useCompaniesAdmin();
  const action = useActionConfirmation<PendingAction>();
  const { pending } = action;
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
      <ActionFeedback notice={action.notice} failure={action.failure} onRetry={companies.reload} />
      {companies.loading && !companies.data && <p>A carregar as Empresas…</p>}
      {companies.error && <ErrorAlert error={companies.error} onRetry={companies.reload} />}
      {companies.data && (
        <>
          <div className="toolbar">
            <SelectField
              id={filterId}
              label="Estado"
              value={companies.statusFilter ?? ''}
              options={statusOptions}
              placeholder="Todos os estados"
              onChange={(value) =>
                companies.filterByStatus((value || null) as CompanyStatus | null)
              }
            />
          </div>
          <DataTable
            columns={columns}
            rows={companies.visibleRows}
            rowKey={(c) => c.companyId}
            emptyMessage="Não há Empresas com o estado escolhido."
          />
        </>
      )}
      {pending && (
        <ConfirmDialog
          title={actionTexts[pending.action].title}
          confirmLabel={pending.action === 'suspend' ? 'Suspender' : 'Reativar'}
          busy={action.busy}
          onConfirm={() => void run(pending)}
          onCancel={action.cancel}
        >
          <p>
            Empresa «{pending.company.companyName}». {actionTexts[pending.action].effects}
          </p>
        </ConfirmDialog>
      )}
    </section>
  );
}
