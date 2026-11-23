import { useId } from 'react';
import { Link } from 'react-router';
import { ActionFeedback } from '../components/ActionFeedback';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { type Column, DataTable } from '../components/DataTable';
import { ErrorAlert } from '../components/ErrorAlert';
import { Pagination } from '../components/Pagination';
import { optionsOf, SelectField } from '../components/SelectField';
import { StatusBadge } from '../components/StatusBadge';
import { useAccounts } from '../hooks/useAccounts';
import { useActionConfirmation } from '../hooks/useActionConfirmation';
import { paths } from '../routes/paths';
import type { AccountDto, AccountStatus, UserType } from '../types/api';
import { accountStatusLabels, userTypeLabels } from '../types/labels';
import './admin.css';
import './recruiter.css';

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

const typeOptions = optionsOf(userTypeLabels);
const statusOptions = optionsOf(accountStatusLabels);

/**
 * A07 — contas de utilizador, com pesquisa, filtros e 12 linhas por página. «Bloquear» só numa conta ativa de
 * Candidato ou de Recrutador e «Reativar» só numa conta bloqueada (RF085 a RF087). As contas de Administrador não
 * têm ações e as suspensas reativam-se em Candidatos (RF090).
 */
export default function AccountsPage() {
  const accounts = useAccounts();
  const action = useActionConfirmation<PendingAction>();
  const { pending } = action;
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
      <ActionFeedback notice={action.notice} failure={action.failure} onRetry={accounts.reload} />
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
            <SelectField
              id={typeId}
              label="Tipo"
              value={accounts.typeFilter ?? ''}
              options={typeOptions}
              placeholder="Todos os tipos"
              onChange={(value) =>
                accounts.filter((value || null) as UserType | null, accounts.statusFilter)
              }
            />
            <SelectField
              id={statusId}
              label="Estado"
              value={accounts.statusFilter ?? ''}
              options={statusOptions}
              placeholder="Todos os estados"
              onChange={(value) =>
                accounts.filter(accounts.typeFilter, (value || null) as AccountStatus | null)
              }
            />
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
      {pending && (
        <ConfirmDialog
          title={actionTexts[pending.action].title}
          confirmLabel={pending.action === 'block' ? 'Bloquear' : 'Reativar'}
          busy={action.busy}
          onConfirm={() => void run(pending)}
          onCancel={action.cancel}
        >
          <p>
            Conta {pending.account.email}. {actionTexts[pending.action].effects}
          </p>
        </ConfirmDialog>
      )}
    </section>
  );
}
