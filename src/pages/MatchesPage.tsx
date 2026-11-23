import { useNavigate } from 'react-router';
import { type Column, DataTable } from '../components/DataTable';
import { ErrorAlert } from '../components/ErrorAlert';
import { StatusBadge } from '../components/StatusBadge';
import { useMatches } from '../hooks/useMatches';
import { conversationPath } from '../routes/paths';
import type { MatchDto } from '../types/api';
import './recruiter.css';

/** W21 — Matches da Empresa, com a vaga, o Candidato e os contactos, incluindo vagas encerradas (RF067; UC13). */
export default function MatchesPage() {
  const { data, loading, error, reload } = useMatches();
  const navigate = useNavigate();

  const columns: Column<MatchDto>[] = [
    { key: 'candidate', header: 'Candidato', render: (m) => <strong>{m.counterpartName}</strong> },
    { key: 'job', header: 'Vaga', render: (m) => m.jobTitle },
    { key: 'location', header: 'Localidade', render: (m) => m.locationName },
    {
      key: 'status',
      header: 'Estado da vaga',
      render: (m) => <StatusBadge status={m.jobStatus} />,
    },
    { key: 'email', header: 'E-mail', render: (m) => m.contactEmail },
    { key: 'phone', header: 'Contacto telefónico', render: (m) => m.contactPhone },
    {
      key: 'action',
      header: 'Ação',
      render: (m) => (
        <button type="button" onClick={() => void navigate(conversationPath(m.matchId))}>
          Abrir conversa
        </button>
      ),
    },
  ];

  return (
    <section className="recruiter-page">
      <h1>Matches da Empresa</h1>
      {loading && <p>A carregar os matches…</p>}
      {error && <ErrorAlert error={error} onRetry={reload} />}
      {data && (
        <>
          <DataTable
            columns={columns}
            rows={data}
            rowKey={(m) => m.matchId}
            emptyMessage="Ainda não há matches. Um match surge quando aceita um Candidato em espera."
          />
          <p className="note">Os matches mantêm-se depois de a vaga ser encerrada.</p>
        </>
      )}
    </section>
  );
}
