import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ApiError } from '../api/ApiError';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { type Column, DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { useJobs } from '../hooks/useJobs';
import { editJobPath, paths } from '../routes/paths';
import { jobService } from '../services';
import type { JobDto, JobStatus } from '../types/api';
import { isConflictWithCode } from '../utils/apiErrors';
import { formatDate } from '../utils/date';
import './jobs.css';
import './recruiter.css';

// I070 — JobListPage (modelo de classes do frontend web v02, secção 8.2; ecrãs W09 e W12 a W15 do protótipo v02).

type JobAction = 'publish' | 'suspend' | 'republish' | 'close' | 'delete';

interface ActionText {
  label: string;
  title: string;
  effects: string;
  done: string;
}

const actionTexts: Record<JobAction, ActionText> = {
  publish: {
    label: 'Publicar',
    title: 'Publicar vaga',
    effects: 'Passa a ser apresentada aos Candidatos compatíveis.',
    done: 'publicada',
  },
  suspend: {
    label: 'Suspender',
    title: 'Suspender vaga',
    effects:
      'Deixa de ser apresentada aos Candidatos. Os interesses registados são mantidos e pode voltar a publicá-la.',
    done: 'suspensa',
  },
  republish: {
    label: 'Voltar a publicar',
    title: 'Voltar a publicar vaga',
    effects: 'Volta a ser apresentada aos Candidatos compatíveis.',
    done: 'publicada de novo',
  },
  close: {
    label: 'Encerrar',
    title: 'Encerrar vaga',
    effects:
      'Deixa de ser apresentada. Os interesses e os matches são mantidos. Uma vaga encerrada não pode ser alterada.',
    done: 'encerrada',
  },
  delete: {
    label: 'Eliminar',
    title: 'Eliminar vaga',
    effects: 'A vaga é eliminada e deixa de constar da lista de vagas da Empresa.',
    done: 'eliminada',
  },
};

/** Ações de cada estado (secção 8.2): a vaga encerrada não tem ações. */
const actionsByStatus: Record<JobStatus, JobAction[]> = {
  PUBLISHED: ['suspend', 'close', 'delete'],
  UNPUBLISHED: ['publish', 'delete'],
  SUSPENDED: ['republish', 'close'],
  CLOSED: [],
};

/** Ação à espera de confirmação; `blocked` é a eliminação recusada com interesses registados (W15). */
interface Pending {
  job: JobDto;
  action: JobAction;
  blocked?: string;
}

function run(action: JobAction, jobId: string): Promise<unknown> {
  switch (action) {
    case 'publish':
      return jobService.publish(jobId);
    case 'suspend':
      return jobService.suspend(jobId);
    case 'republish':
      return jobService.republish(jobId);
    case 'close':
      return jobService.close(jobId);
    default:
      return jobService.delete(jobId);
  }
}

/** W09 — vagas da Empresa, com as ações de cada estado (RF053 a RF059, RF114, RF115; UC09, UC10). */
export default function JobListPage() {
  const { data, loading, error, reload } = useJobs();
  const navigate = useNavigate();
  const location = useLocation();
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(
    (location.state as { notice?: string } | null)?.notice ?? null,
  );
  const [failure, setFailure] = useState<string | null>(null);

  const confirm = async (job: JobDto, action: JobAction) => {
    setBusy(true);
    setNotice(null);
    setFailure(null);
    try {
      await run(action, job.jobId);
      setPending(null);
      setNotice(`Vaga «${job.title}» ${actionTexts[action].done}.`);
      reload();
    } catch (caught) {
      const apiError = ApiError.from(caught);
      if (action === 'delete' && isConflictWithCode(apiError, 'ERR-38')) {
        setPending({ job, action, blocked: apiError.message });
      } else {
        // ERR-30: o estado mudou entretanto; a lista é lida de novo (secção 6).
        setPending(null);
        setFailure(apiError.message);
        reload();
      }
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<JobDto>[] = [
    {
      key: 'title',
      header: 'Função',
      render: (job) => (
        <>
          <strong>{job.title}</strong>
          {job.isUrgent && <span className="tag urgent">Urgente</span>}
        </>
      ),
    },
    { key: 'location', header: 'Localidade', render: (job) => job.locationName },
    { key: 'status', header: 'Estado', render: (job) => <StatusBadge status={job.status} /> },
    {
      key: 'waiting',
      header: 'Candidatos em espera',
      render: (job) => (job.status === 'CLOSED' ? '–' : job.waitingCandidates),
    },
    {
      key: 'expiresAt',
      header: 'Data-limite',
      render: (job) => (job.expiresAt === null ? '–' : formatDate(job.expiresAt)),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (job) =>
        job.status === 'CLOSED' ? (
          <span className="note">sem ações</span>
        ) : (
          <div className="row-actions">
            <button type="button" onClick={() => navigate(editJobPath(job.jobId))}>
              Editar
            </button>
            {actionsByStatus[job.status].map((action) => (
              <button key={action} type="button" onClick={() => setPending({ job, action })}>
                {actionTexts[action].label}
              </button>
            ))}
          </div>
        ),
    },
  ];

  return (
    <section className="recruiter-page">
      <div className="page-header">
        <h1>Vagas</h1>
        <button type="button" className="primary" onClick={() => navigate(paths.newJob)}>
          Nova vaga
        </button>
      </div>
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      {failure && (
        <p role="alert" className="alert">
          {failure}
        </p>
      )}
      {loading && data === null && <p>A carregar as vagas…</p>}
      {error && (
        <div role="alert" className="alert">
          <p>{error.message}</p>
          <button type="button" onClick={reload}>
            Tentar de novo
          </button>
        </div>
      )}
      {data && (
        <DataTable
          columns={columns}
          rows={data}
          rowKey={(job) => job.jobId}
          emptyMessage="Ainda não criou vagas. Use «Nova vaga» para criar a primeira."
        />
      )}
      <p className="note info-box">
        Uma vaga com interesses registados não pode ser eliminada, apenas encerrada.
      </p>

      {pending && pending.blocked === undefined && (
        <ConfirmDialog
          title={actionTexts[pending.action].title}
          confirmLabel={actionTexts[pending.action].label}
          busy={busy}
          onConfirm={() => void confirm(pending.job, pending.action)}
          onCancel={() => setPending(null)}
        >
          <p>
            Vaga: {pending.job.title}. {actionTexts[pending.action].effects}
          </p>
        </ConfirmDialog>
      )}
      {pending?.blocked !== undefined && (
        <ConfirmDialog
          title="Não é possível eliminar a vaga"
          confirmLabel="Encerrar vaga"
          cancelLabel="Voltar"
          busy={busy}
          onConfirm={() => void confirm(pending.job, 'close')}
          onCancel={() => setPending(null)}
        >
          <p>
            Vaga: {pending.job.title}. {pending.blocked}
          </p>
        </ConfirmDialog>
      )}
    </section>
  );
}
