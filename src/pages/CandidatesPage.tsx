import { Link } from 'react-router';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { type Column, DataTable } from '../components/DataTable';
import { ErrorAlert } from '../components/ErrorAlert';
import { StatusBadge } from '../components/StatusBadge';
import { useActionConfirmation } from '../hooks/useActionConfirmation';
import { useCandidatesAdmin } from '../hooks/useCandidatesAdmin';
import { paths } from '../routes/paths';
import type { CandidateAdminDto } from '../types/api';
import { formatDate } from '../utils/date';
import './admin.css';
import './recruiter.css';

// I073 — CandidatesPage (modelo de classes do frontend web v02, secção 8.3; ecrãs A08 e A08b do protótipo v02).

type CandidateAction = 'suspend' | 'reactivate';

interface PendingAction {
  candidate: CandidateAdminDto;
  action: CandidateAction;
}

const actionTexts: Record<CandidateAction, { title: string; effects: string; done: string }> = {
  suspend: {
    title: 'Suspender conta de Candidato',
    effects:
      'O Candidato deixa de poder iniciar sessão e as conversas abertas da conta passam a modo apenas de consulta.',
    done: 'suspensa',
  },
  reactivate: {
    title: 'Reativar conta de Candidato',
    effects:
      'O Candidato volta a poder iniciar sessão. As conversas encerradas pela suspensão mantêm-se em modo apenas de consulta.',
    done: 'reativada',
  },
};

function summary(total: number, active: number): string {
  const candidates = total === 1 ? '1 Candidato' : `${total} Candidatos`;
  const actives = active === 1 ? '1 ativo' : `${active} ativos`;
  return `${candidates} · ${actives}`;
}

/**
 * A08 — Candidatos, com «Suspender» numa conta ativa e «Reativar» numa conta suspensa (RF088 a RF090). A reativação
 * usa o `candidateId`, que é o identificador da conta. As contas bloqueadas reativam-se em Contas de utilizador.
 */
export default function CandidatesPage() {
  const candidates = useCandidatesAdmin();
  const action = useActionConfirmation<PendingAction>();

  const run = ({ candidate, action: kind }: PendingAction) => {
    const operation = kind === 'suspend' ? candidates.suspend : candidates.reactivate;
    return action.confirm(
      () => operation(candidate.candidateId),
      `Conta de ${candidate.fullName} ${actionTexts[kind].done}.`,
    );
  };

  const columns: Column<CandidateAdminDto>[] = [
    { key: 'name', header: 'Nome', render: (c) => <strong>{c.fullName}</strong> },
    { key: 'email', header: 'Correio eletrónico', render: (c) => c.email },
    { key: 'location', header: 'Localidade', render: (c) => c.locationName },
    { key: 'registeredAt', header: 'Data de registo', render: (c) => formatDate(c.registeredAt) },
    { key: 'status', header: 'Estado', render: (c) => <StatusBadge status={c.status} /> },
    {
      key: 'actions',
      header: 'Ações',
      render: (c) => (
        <div className="row-actions">
          {c.status === 'ACTIVE' && (
            <button
              type="button"
              onClick={() => action.request({ candidate: c, action: 'suspend' })}
            >
              Suspender
            </button>
          )}
          {c.status === 'SUSPENDED' && (
            <button
              type="button"
              onClick={() => action.request({ candidate: c, action: 'reactivate' })}
            >
              Reativar
            </button>
          )}
          {c.status === 'BLOCKED' && <Link to={paths.adminAccounts}>Reativar em Contas</Link>}
        </div>
      ),
    },
  ];

  return (
    <section className="recruiter-page admin-page">
      <h1>Candidatos</h1>
      {action.notice && (
        <p role="status" className="notice">
          {action.notice}
        </p>
      )}
      {action.failure && <ErrorAlert error={action.failure} onRetry={candidates.reload} />}
      {candidates.loading && !candidates.data && <p>A carregar os Candidatos…</p>}
      {candidates.error && <ErrorAlert error={candidates.error} onRetry={candidates.reload} />}
      {candidates.data && (
        <>
          <p className="summary">{summary(candidates.data.length, candidates.activeCount)}</p>
          <DataTable
            columns={columns}
            rows={candidates.data}
            rowKey={(c) => c.candidateId}
            emptyMessage="Ainda não há Candidatos registados."
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
            Candidato {action.pending.candidate.fullName}.{' '}
            {actionTexts[action.pending.action].effects}
          </p>
        </ConfirmDialog>
      )}
    </section>
  );
}
