import { useSession } from '../hooks/useSession';
import { ErrorAlert } from './ErrorAlert';
import { SignOutButton } from './SignOutButton';

/**
 * Mostrado pelas proteções de rota até o estado da Empresa estar lido (por exemplo, ao recarregar o separador), com
 * «Tentar de novo» se a leitura falhar.
 */
export function CompanyLoading() {
  const { companyError, refreshCompanyStatus } = useSession();
  if (companyError === null) {
    return <p className="route-loading">A carregar…</p>;
  }
  return (
    <ErrorAlert
      error={companyError}
      onRetry={() => void refreshCompanyStatus()}
      className="form-banner route-loading"
    >
      <SignOutButton />
    </ErrorAlert>
  );
}
