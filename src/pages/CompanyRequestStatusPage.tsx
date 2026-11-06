import { useState } from 'react';
import { Link } from 'react-router';
import { SignOutButton } from '../components/SignOutButton';
import { useSession } from '../hooks/useSession';
import { paths } from '../routes/paths';
import { companyStatusLabels } from '../types/labels';
import './auth.css';

// I069 — CompanyRequestStatusPage (modelo de classes do frontend web v02, secção 8; ecrã W05 do protótipo v02).
// Fora do âmbito da I069: W06 e W26 (nova submissão da Empresa recusada e dados da Empresa só de leitura).

/**
 * Estado do pedido da Empresa. Pendente: aviso de que não pode publicar vagas nem aceder a candidatos. Recusada ou
 * suspensa: só o estado e o motivo.
 */
export default function CompanyRequestStatusPage() {
  const { companyStatus, companyError, refreshCompanyStatus } = useSession();
  const [refreshing, setRefreshing] = useState(false);

  if (companyStatus === null) {
    return null;
  }

  const refresh = async () => {
    setRefreshing(true);
    await refreshCompanyStatus();
    setRefreshing(false);
  };

  return (
    <main className="auth-page">
      <section className="auth-card wide">
        <h1>Estado do pedido da Empresa</h1>
        <p>
          Estado: <strong>{companyStatusLabels[companyStatus.status]}</strong>
        </p>
        {companyStatus.status === 'PENDING' && (
          <p className="form-banner" role="status">
            A Empresa aguarda aprovação. Enquanto o pedido estiver pendente, não pode publicar vagas
            nem aceder a candidatos.
          </p>
        )}
        {companyStatus.rejectionReason && <p>Motivo: {companyStatus.rejectionReason}</p>}
        {companyStatus.status === 'SUSPENDED' && (
          <p className="auth-links">
            <Link to={paths.matches}>Matches</Link> ·{' '}
            <Link to={paths.conversations}>Conversas</Link>
          </p>
        )}
        {companyError && (
          <div role="alert" className="form-banner">
            <p>{companyError.message}</p>
          </div>
        )}
        <div className="auth-actions">
          <button type="button" className="primary" disabled={refreshing} onClick={refresh}>
            Atualizar estado
          </button>
          <SignOutButton />
        </div>
      </section>
    </main>
  );
}
