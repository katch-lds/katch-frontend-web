import { useId } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { type Column, DataTable } from '../components/DataTable';
import { candidateProfilePath } from '../routes/paths';
import { useJobs } from '../hooks/useJobs';
import { useWaitingCandidates } from '../hooks/useWaitingCandidates';
import type { ApiError } from '../api/ApiError';
import type { JobDto, WaitingCandidateDto } from '../types/api';
import { jobStatusLabels } from '../types/labels';
import { formatDateTime } from '../utils/date';
import './recruiter.css';

function ErrorAlert({ error, onRetry }: Readonly<{ error: ApiError; onRetry: () => void }>) {
  return (
    <div role="alert" className="alert">
      <p>{error.message}</p>
      <button type="button" onClick={onRetry}>
        Tentar de novo
      </button>
    </div>
  );
}

/** Lista dos candidatos em espera de uma vaga; sem ações de decisão (RF060, RF065). */
function WaitingList({ jobId }: Readonly<{ jobId: string }>) {
  const { data, loading, error, reload } = useWaitingCandidates(jobId);
  const navigate = useNavigate();

  const columns: Column<WaitingCandidateDto>[] = [
    { key: 'candidate', header: 'Candidato', render: (c) => <strong>{c.fullName}</strong> },
    { key: 'role', header: 'Função pretendida', render: (c) => c.desiredRole ?? '—' },
    { key: 'location', header: 'Localidade', render: (c) => c.locationName },
    { key: 'interestAt', header: 'Data do interesse', render: (c) => formatDateTime(c.interestAt) },
    {
      key: 'action',
      header: 'Ação',
      render: (c) => (
        <button
          type="button"
          onClick={() => navigate(candidateProfilePath(c.matchId), { state: { jobId } })}
        >
          Abrir perfil
        </button>
      ),
    },
  ];

  return (
    <>
      {loading && <p>A carregar os candidatos em espera…</p>}
      {error && <ErrorAlert error={error} onRetry={reload} />}
      {data && (
        <DataTable
          columns={columns}
          rows={data}
          rowKey={(c) => c.matchId}
          emptyMessage="Esta vaga ainda não tem candidatos em espera."
        />
      )}
    </>
  );
}

function jobOptionLabel(job: JobDto): string {
  return `${job.title} — ${jobStatusLabels[job.status]} (${job.waitingCandidates} em espera)`;
}

/** W16 — Candidatos em espera por vaga, com acesso ao perfil completo (RF060; UC11). */
export default function WaitingCandidatesPage() {
  const jobs = useJobs();
  const [params, setParams] = useSearchParams();
  const selectId = useId();
  const requested = params.get('vaga');
  // Só vagas da própria Empresa: um identificador desconhecido não seleciona nada (a autorização final é do servidor).
  const selected = jobs.data?.find((job) => job.jobId === requested) ?? null;

  return (
    <section className="recruiter-page">
      <h1>Candidatos em espera</h1>
      {jobs.loading && <p>A carregar as vagas…</p>}
      {jobs.error && <ErrorAlert error={jobs.error} onRetry={jobs.reload} />}
      {jobs.data?.length === 0 && <p className="empty-state">A Empresa ainda não tem vagas.</p>}
      {jobs.data && jobs.data.length > 0 && (
        <>
          <label htmlFor={selectId}>Vaga</label>
          <select
            id={selectId}
            value={selected?.jobId ?? ''}
            onChange={(event) => setParams(event.target.value ? { vaga: event.target.value } : {})}
          >
            <option value="">Escolha uma vaga</option>
            {jobs.data.map((job) => (
              <option key={job.jobId} value={job.jobId}>
                {jobOptionLabel(job)}
              </option>
            ))}
          </select>
          {selected ? (
            <WaitingList key={selected.jobId} jobId={selected.jobId} />
          ) : (
            <p className="note">Escolha uma vaga para ver os candidatos em espera.</p>
          )}
        </>
      )}
    </section>
  );
}
