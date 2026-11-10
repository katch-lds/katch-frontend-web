import { Link, Navigate, useLocation } from 'react-router';
import { ProtectedImage } from '../components/ProtectedImage';
import { conversationPath, paths, waitingCandidatesPath } from '../routes/paths';
import type { MatchDto } from '../types/api';
import './recruiter.css';
import './candidate.css';

interface MatchState {
  match: MatchDto;
  photoUrl: string | null;
}

/** W19 — Match confirmado, com os contactos do candidato (RF066, RF067). O match só chega por `location.state`. */
export default function MatchConfirmedPage() {
  const state = useLocation().state as Partial<MatchState> | null;
  if (!state?.match) {
    return <Navigate to={paths.matches} replace />;
  }
  const { match, photoUrl = null } = state;

  return (
    <section className="recruiter-page match-confirmed">
      <h1>Match confirmado</h1>
      <div className="profile-grid">
        <ProtectedImage url={photoUrl} alt={`Fotografia de ${match.counterpartName}`} />
        <dl className="profile-data">
          <dt>Candidato</dt>
          <dd>{match.counterpartName}</dd>
          <dt>Vaga</dt>
          <dd>{match.jobTitle}</dd>
          <dt>Localidade</dt>
          <dd>{match.locationName}</dd>
          <dt>Email</dt>
          <dd>
            <a href={`mailto:${match.contactEmail}`}>{match.contactEmail}</a>
          </dd>
          <dt>Telefone</dt>
          <dd>
            <a href={`tel:${match.contactPhone}`}>{match.contactPhone}</a>
          </dd>
        </dl>
      </div>
      <nav className="decision-actions" aria-label="Seguintes passos">
        <Link className="button-link primary" to={conversationPath(match.matchId)}>
          Abrir conversa
        </Link>
        <Link className="button-link" to={paths.matches}>
          Ver matches
        </Link>
        <Link className="button-link" to={waitingCandidatesPath()}>
          Voltar aos candidatos
        </Link>
      </nav>
    </section>
  );
}
