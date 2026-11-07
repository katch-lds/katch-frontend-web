import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import type { ApiError } from '../api/ApiError';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ProtectedImage } from '../components/ProtectedImage';
import { SkillTag } from '../components/SkillTag';
import { useCandidateProfile } from '../hooks/useCandidateProfile';
import { matchConfirmedPath, waitingCandidatesPath } from '../routes/paths';
import type { CandidateFullProfileDto } from '../types/api';
import { availabilityLabels } from '../types/labels';
import { formatDayAndTime } from '../utils/date';
import './recruiter.css';
import './candidate.css';

type Pending = 'accept' | 'reject' | null;

/** Só `http:` e `https:` viram ligação; qualquer outro esquema (ex.: `javascript:`) fica como texto. */
function isWebLink(link: string): boolean {
  try {
    const { protocol } = new URL(link);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

function LinkList({ links }: Readonly<{ links: string[] }>) {
  if (links.length === 0) {
    return <p>—</p>;
  }
  return (
    <ul className="link-list">
      {links.map((link) => (
        <li key={link}>
          {isWebLink(link) ? (
            <a href={link} target="_blank" rel="noopener noreferrer">
              {link}
            </a>
          ) : (
            <span>{link}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function SkillList({ skills }: Readonly<{ skills: CandidateFullProfileDto['skills'] }>) {
  if (skills.length === 0) {
    return <p>—</p>;
  }
  return (
    <>
      <ul className="skill-list">
        {skills.map((skill) => (
          <SkillTag key={skill.name} name={skill.name} highlighted={skill.matchesJob} />
        ))}
      </ul>
      <p className="note">✓ Competência que coincide com as pretendidas na vaga.</p>
    </>
  );
}

function ProfileDetails({ profile }: Readonly<{ profile: CandidateFullProfileDto }>) {
  return (
    <div className="profile-grid">
      <ProtectedImage url={profile.photoUrl} alt={`Fotografia de ${profile.fullName}`} />
      <dl className="profile-data">
        <dt>Localidade</dt>
        <dd>{profile.locationName}</dd>
        <dt>Função pretendida</dt>
        <dd>{profile.desiredRole ?? '—'}</dd>
        <dt>Disponibilidade</dt>
        <dd>{profile.availability ? availabilityLabels[profile.availability] : '—'}</dd>
        <dt>Resumo de experiência</dt>
        <dd>{profile.experienceSummary ?? '—'}</dd>
      </dl>
    </div>
  );
}

function CvSection({
  hasCv,
  canOpen,
  onOpen,
}: Readonly<{ hasCv: boolean; canOpen: boolean; onOpen: () => void }>) {
  if (!hasCv) {
    return <p>Este candidato não tem CV.</p>;
  }
  return canOpen ? (
    <button type="button" onClick={onOpen}>
      Abrir CV (PDF)
    </button>
  ) : null;
}

function ErrorAlert({ error, onRetry }: Readonly<{ error: ApiError; onRetry?: () => void }>) {
  return (
    <div role="alert" className="alert">
      <p>{error.message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          Tentar de novo
        </button>
      )}
    </div>
  );
}

function DecisionDialog({
  kind,
  busy,
  onConfirm,
  onCancel,
}: Readonly<{
  kind: 'accept' | 'reject';
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}>) {
  const accepting = kind === 'accept';
  return (
    <ConfirmDialog
      title={accepting ? 'Aceitar candidato' : 'Recusar candidato'}
      confirmLabel={accepting ? 'Aceitar' : 'Recusar'}
      busy={busy}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <p>{accepting ? 'Ao aceitar:' : 'Ao recusar:'}</p>
      {accepting ? (
        <ul>
          <li>o match fica confirmado;</li>
          <li>o contacto do candidato fica disponível;</li>
          <li>é criada a conversa.</li>
        </ul>
      ) : (
        <ul>
          <li>o candidato deixa a lista de espera desta vaga;</li>
          <li>não volta a ser sugerido para esta vaga;</li>
          <li>o candidato não é avisado.</li>
        </ul>
      )}
      <p>
        <strong>Esta decisão não pode ser alterada.</strong>
      </p>
    </ConfirmDialog>
  );
}

function BackLink({ jobId }: Readonly<{ jobId?: string }>) {
  return <Link to={waitingCandidatesPath(jobId)}>Voltar aos candidatos</Link>;
}

/** W17 — Perfil completo do candidato, com as decisões de aceitar e recusar (RF061 a RF064, RF117, RF118). */
export default function CandidateProfilePage() {
  const { matchId = '' } = useParams();
  return <CandidateProfile key={matchId} matchId={matchId} />;
}

function CandidateProfile({ matchId }: Readonly<{ matchId: string }>) {
  const location = useLocation();
  const navigate = useNavigate();
  const jobId = (location.state as { jobId?: string } | null)?.jobId;
  const state = useCandidateProfile(matchId);
  const [pending, setPending] = useState<Pending>(null);
  const { data: profile, decision } = state;
  const decided = decision === 'accepted' || decision === 'rejected';

  const confirm = async () => {
    const kind = pending;
    if (kind === 'accept') {
      const match = await state.accept();
      if (match !== null) {
        navigate(matchConfirmedPath(matchId), {
          state: { match, photoUrl: profile?.photoUrl ?? null },
        });
        return;
      }
    } else {
      await state.reject();
    }
    setPending(null);
  };

  if (state.loading) {
    return (
      <section className="recruiter-page">
        <p role="status">A carregar o perfil do candidato…</p>
      </section>
    );
  }
  if (state.error || !profile) {
    const error = state.error;
    // 403, 404 e 409 são respostas definitivas do servidor: repetir o pedido não as muda.
    const refused = error !== null && error.httpStatus >= 400 && error.httpStatus < 500;
    return (
      <section className="recruiter-page">
        <h1>Perfil do candidato</h1>
        {error && <ErrorAlert error={error} onRetry={refused ? undefined : state.reload} />}
        <BackLink jobId={jobId} />
      </section>
    );
  }

  return (
    <section className="recruiter-page candidate-profile">
      <h1>
        {profile.desiredRole ? `${profile.fullName} — ${profile.desiredRole}` : profile.fullName}
      </h1>
      <p className="note">
        Abertura do perfil registada {formatDayAndTime(profile.profileOpenedAt)}.
      </p>
      <ProfileDetails profile={profile} />
      <h2>Competências</h2>
      <SkillList skills={profile.skills} />
      <h2>Hiperligações</h2>
      <LinkList links={profile.links} />
      <h2>Curriculum vitae</h2>
      <CvSection hasCv={profile.hasCv} canOpen={!decided} onOpen={state.openCv} />
      {state.cvError && <ErrorAlert error={state.cvError} />}
      {state.decisionError && <ErrorAlert error={state.decisionError} />}
      {decision === 'rejected' && (
        <p role="status">Candidato recusado. Não volta a ser sugerido para esta vaga.</p>
      )}
      {!decided && (
        <div className="decision-actions">
          <button
            type="button"
            className="primary"
            disabled={decision === 'submitting'}
            onClick={() => setPending('accept')}
          >
            Aceitar
          </button>
          <button
            type="button"
            disabled={decision === 'submitting'}
            onClick={() => setPending('reject')}
          >
            Recusar
          </button>
        </div>
      )}
      <BackLink jobId={jobId} />
      {pending && (
        <DecisionDialog
          kind={pending}
          busy={decision === 'submitting'}
          onConfirm={confirm}
          onCancel={() => setPending(null)}
        />
      )}
    </section>
  );
}
