import { useId } from 'react';
import { Link } from 'react-router';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { type Column, DataTable } from '../components/DataTable';
import { ErrorAlert } from '../components/ErrorAlert';
import { Pagination } from '../components/Pagination';
import { StatusBadge } from '../components/StatusBadge';
import { useAccounts } from '../hooks/useAccounts';
import { useActionConfirmation } from '../hooks/useActionConfirmation';
import { paths } from '../routes/paths';
import type { AccountDto, AccountStatus, UserType } from '../types/api';
import { accountStatusLabels, userTypeLabels } from '../types/labels';
import './admin.css';
import './recruiter.css';

// I073 — AccountsPage (modelo de classes do frontend web v02, secção 8.3; ecrãs A07, A07b, A07c e A07d do protótipo
// v02).

type AccountAction = 'block' | 'reactivate';

interface PendingAction {
  account: AccountDto;
  action: AccountAction;
}

const actionTexts: Record<AccountAction, { title: string; effects: string; done: string }> = {
  block: {
    title: 'Bloquear conta',
    effects:
      'A pessoa deixa de poder iniciar sessão e as conversas abertas da conta passam a modo apenas de consulta.',
    done: 'bloqueada',
  },
  reactivate: {
    title: 'Reativar conta',
    effects:
      'A pessoa volta a poder iniciar sessão. As conversas encerradas pelo bloqueio mantêm-se em modo apenas de consulta.',
    done: 'reativada',
  },
};

const typeFilters: UserType[] = ['CANDIDATE', 'RECRUITER', 'ADMIN'];
const statusFilters: AccountStatus[] = ['ACTIVE', 'BLOCKED', 'SUSPENDED'];

/**
 * A07 — contas de utilizador, com pesquisa, filtros e 12 linhas por página. «Bloquear» só numa conta ativa de
 * Candidato ou de Recrutador e «Reativar» só numa conta bloqueada (RF085 a RF087). As contas de Administrador não
 * têm ações e as suspensas reativam-se em Candidatos (RF090).
 */
export default function AccountsPage() {
  const accounts = useAccounts();
  const action = useActionConfirmation<PendingAction>();
  const searchId = useId();
  const typeId = useId();
  const statusId = useId();

  const run = ({ account, action: kind }: PendingAction) => {
    const operation = kind === 'block' ? accounts.block : accounts.reactivate;
    return action.confirm(
      () => operation(account.userId),
      `Conta ${account.email} ${actionTexts[kind].done}.`,
    );
  };

  const columns: Column<AccountDto>[] = [
    { key: 'email', header: 'Correio eletrónico', render: (a) => <strong>{a.email}</strong> },
    { key: 'type', header: 'Tipo', render: (a) => userTypeLabels[a.userType] },
    { key: 'status', header: 'Estado', render: (a) => <StatusBadge status={a.status} /> },
    {
      key: 'actions',
      header: 'Ações',
      render: (a) => (
        <div className="row-actions">
          {a.userType !== 'ADMIN' && a.status === 'ACTIVE' && (
            <button type="button" onClick={() => action.request({ account: a, action: 'block' })}>
              Bloquear
            </button>
          )}
          {a.userType !== 'ADMIN' && a.status === 'BLOCKED' && (
            <button
              type="button"
              onClick={() => action.request({ account: a, action: 'reactivate' })}
            >
              Reativar
            </button>
          )}
          {a.status === 'SUSPENDED' && (
            <Link to={paths.adminCandidates}>Reativar em Candidatos</Link>
          )}
        </div>
      ),
    },
  ];

  return (
    <section className="recruiter-page admin-page">
      <h1>Contas de utilizador</h1>
      {action.notice && (
        <p role="status" className="notice">
          {action.notice}
        </p>
      )}
      {action.failure && <ErrorAlert error={action.failure} onRetry={accounts.reload} />}
      {accounts.loading && !accounts.data && <p>A carregar as contas…</p>}
      {accounts.error && <ErrorAlert error={accounts.error} onRetry={accounts.reload} />}
      {accounts.data && (
        <>
          <div className="toolbar">
            <div className="form-field">
              <label htmlFor={searchId}>Pesquisar por correio eletrónico</label>
              <input
                id={searchId}
                type="search"
                value={accounts.emailQuery}
                onChange={(event) => accounts.search(event.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor={typeId}>Tipo</label>
              <select
                id={typeId}
                value={accounts.typeFilter ?? ''}
                onChange={(event) =>
                  accounts.filter(
                    (event.target.value || null) as UserType | null,
                    accounts.statusFilter,
                  )
                }
              >
                <option value="">Todos os tipos</option>
                {typeFilters.map((type) => (
                  <option key={type} value={type}>
                    {userTypeLabels[type]}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor={statusId}>Estado</label>
              <select
                id={statusId}
                value={accounts.statusFilter ?? ''}
                onChange={(event) =>
                  accounts.filter(
                    accounts.typeFilter,
                    (event.target.value || null) as AccountStatus | null,
                  )
                }
              >
                <option value="">Todos os estados</option>
                {statusFilters.map((status) => (
                  <option key={status} value={status}>
                    {accountStatusLabels[status]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DataTable
            columns={columns}
            rows={accounts.visibleRows}
            rowKey={(a) => a.userId}
            emptyMessage="Não há contas que correspondam à pesquisa."
          />
          <Pagination
            page={accounts.page}
            pageCount={accounts.pageCount}
            onPageChange={accounts.goToPage}
          />
        </>
      )}
      {action.pending && (
        <ConfirmDialog
          title={actionTexts[action.pending.action].title}
          confirmLabel={action.pending.action === 'block' ? 'Bloquear' : 'Reativar'}
          busy={action.busy}
          onConfirm={() => void run(action.pending as PendingAction)}
          onCancel={action.cancel}
        >
          <p>
            Conta {action.pending.account.email}. {actionTexts[action.pending.action].effects}
          </p>
        </ConfirmDialog>
      )}
    </section>
  );
}
