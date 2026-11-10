import { Navigate } from 'react-router';
import { CompanyLoading } from '../components/CompanyLoading';
import { useSession } from '../hooks/useSession';
import { homePath, paths } from './paths';

// I069 — encaminhamento para a página inicial de quem tem sessão (modelo de classes do frontend web v02, secção 7.2).

/** Leva para a página inicial do perfil; o Recrutador espera pelo estado da Empresa. Sem sessão, vai para o início. */
export function SessionHome() {
  const { session, companyStatus, companyLoaded } = useSession();
  if (session === null) {
    return <Navigate to={paths.login} replace />;
  }
  if (session.userType === 'RECRUITER' && !companyLoaded) {
    return <CompanyLoading />;
  }
  return <Navigate to={homePath(session, companyStatus)} replace />;
}
