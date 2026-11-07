import { useState } from 'react';
import { CompanyDataForm } from '../components/CompanyDataForm';
import { CompanyDetails } from '../components/CompanyDetails';
import { useCompany } from '../hooks/useCompany';
import { useSession } from '../hooks/useSession';
import { companyService } from '../services';
import type { CompanyRegistrationDto, CompanyRegistrationRequest } from '../types/api';
import { companyStatusLabels } from '../types/labels';
import { isConflictWithCode } from '../utils/apiErrors';
import { companyFormFrom } from '../validation/forms';
import './auth.css';
import './recruiter.css';

// I069 — CompanyRequestStatusPage (modelo de classes do frontend web v02, secção 8.2; ecrãs W05, W06 e W26).

/**
 * Estado do pedido da Empresa, dentro da moldura do Recrutador. Pendente: aviso e dados só de leitura (W05).
 * Recusada: motivo e formulário preenchido para corrigir e submeter de novo (W06, RF045). Suspensa: dados só de
 * leitura (W26). A decisão do Administrador conhece-se ao abrir a página e com «Atualizar estado» (RF044).
 */
export default function CompanyRequestStatusPage() {
  const { companyStatus, companyError, refreshCompanyStatus } = useSession();
  const company = useCompany();
  const [refreshing, setRefreshing] = useState(false);

  if (companyStatus === null) {
    return null;
  }

  const reloadAll = async () => {
    await refreshCompanyStatus();
    company.reload();
  };

  const refresh = async () => {
    setRefreshing(true);
    await reloadAll();
    setRefreshing(false);
  };

  const resubmit = async (request: CompanyRegistrationRequest) => {
    try {
      await companyService.resubmit(request);
    } catch (caught) {
      // ERR-30: a Empresa já não está recusada. Não é falha: lê-se o estado e mostra-se o ecrã do estado novo.
      if (!isConflictWithCode(caught, 'ERR-30')) {
        throw caught;
      }
    }
    await reloadAll();
  };

  const { status, rejectionReason } = companyStatus;
  return (
    <section className="recruiter-page company-status">
      <h1>Estado do pedido da Empresa</h1>
      <p>
        Estado: <strong>{companyStatusLabels[status]}</strong>
      </p>
      {status === 'PENDING' && (
        <p className="form-notice" role="status">
          A Empresa aguarda aprovação.
        </p>
      )}
      {rejectionReason && (
        <p className={status === 'REJECTED' ? 'form-banner' : undefined}>
          Motivo: {rejectionReason}
        </p>
      )}
      <p>A Empresa não pode publicar vagas nem aceder a candidatos.</p>
      {companyError && (
        <div role="alert" className="form-banner">
          <p>{companyError.message}</p>
        </div>
      )}
      <Registration
        status={status}
        registration={company.data}
        loading={company.loading}
        failure={company.error?.message ?? null}
        onRetry={company.reload}
        onResubmit={resubmit}
      />
      <div className="auth-actions">
        <button type="button" disabled={refreshing} onClick={refresh}>
          Atualizar estado
        </button>
      </div>
    </section>
  );
}

interface RegistrationProps {
  status: string;
  registration: CompanyRegistrationDto | null;
  loading: boolean;
  failure: string | null;
  onRetry: () => void;
  onResubmit: (request: CompanyRegistrationRequest) => Promise<void>;
}

/** Dados de registo: só de leitura, ou em formulário para corrigir quando a Empresa foi recusada. */
function Registration({
  status,
  registration,
  loading,
  failure,
  onRetry,
  onResubmit,
}: Readonly<RegistrationProps>) {
  if (failure !== null) {
    return (
      <div role="alert" className="form-banner">
        <p>{failure}</p>
        <button type="button" onClick={onRetry}>
          Tentar de novo
        </button>
      </div>
    );
  }
  if (registration === null) {
    return loading ? <p>A carregar os dados da Empresa…</p> : null;
  }
  if (status === 'REJECTED') {
    return (
      <>
        <h2>Corrigir os dados</h2>
        <CompanyDataForm
          initialValues={companyFormFrom(registration)}
          submitLabel="Submeter novamente"
          onSubmit={onResubmit}
        />
      </>
    );
  }
  return (
    <>
      <h2>Dados submetidos</h2>
      <CompanyDetails registration={registration} />
    </>
  );
}
