import { useNavigate } from 'react-router';
import { CompanyDataForm } from '../components/CompanyDataForm';
import { SignOutButton } from '../components/SignOutButton';
import { useSession } from '../hooks/useSession';
import { paths } from '../routes/paths';
import { companyService } from '../services';
import type { CompanyRegistrationRequest } from '../types/api';
import { isConflictWithCode } from '../utils/apiErrors';
import { EMPTY_COMPANY_FORM } from '../validation/forms';
import './auth.css';

// I069 — CompanyRegistrationPage (modelo de classes do frontend web v02, secção 8; ecrãs W03 e W04 do protótipo v02).

/** Primeiro registo da Empresa, com os oito dados e o erro por campo; segue para o estado do pedido. */
export default function CompanyRegistrationPage() {
  const { refreshCompanyStatus } = useSession();
  const navigate = useNavigate();

  const register = async (request: CompanyRegistrationRequest) => {
    try {
      await companyService.register(request);
    } catch (caught) {
      // ERR-40: já existe Empresa. Não é falha: lê-se o estado e segue-se para a página do estado.
      if (!isConflictWithCode(caught, 'ERR-40')) {
        throw caught;
      }
    }
    await refreshCompanyStatus();
    await navigate(paths.companyStatus);
  };

  return (
    <main className="auth-page">
      <section className="auth-card wide">
        <h1>Registo da Empresa</h1>
        <p className="auth-subtitle">Indique os dados da Empresa para pedir a aprovação.</p>
        <CompanyDataForm
          initialValues={EMPTY_COMPANY_FORM}
          submitLabel="Pedir aprovação"
          onSubmit={register}
        />
        <p className="auth-links">
          <SignOutButton />
        </p>
      </section>
    </main>
  );
}
