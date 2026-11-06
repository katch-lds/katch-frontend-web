import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router';
import { ApiError } from '../api/ApiError';
import { FormBanner } from '../components/FormBanner';
import { SelectField } from '../components/SelectField';
import { SignOutButton } from '../components/SignOutButton';
import { SubmitButton } from '../components/SubmitButton';
import { TextField } from '../components/TextField';
import { useFormSubmission } from '../hooks/useFormSubmission';
import { useLocations } from '../hooks/useLocations';
import { useSession } from '../hooks/useSession';
import { paths } from '../routes/paths';
import { companyService } from '../services';
import type { Industry } from '../types/api';
import { industryLabels } from '../types/labels';
import {
  type CompanyForm,
  EMPTY_COMPANY_FORM,
  toCompanyRequest,
  validateCompany,
} from '../validation/forms';
import './auth.css';

// I069 — CompanyRegistrationPage (modelo de classes do frontend web v02, secção 8; ecrãs W03 e W04 do protótipo v02).

const industryOptions = Object.entries(industryLabels).map(([value, label]) => ({ value, label }));

/** Já existe Empresa (409 ERR-40): não é falha, o estado é lido e segue-se para a página do estado. */
function isCompanyAlreadyRegistered(error: unknown): boolean {
  return error instanceof ApiError && error.isConflict() && error.code === 'ERR-40';
}

/** Primeiro registo da Empresa, com os oito dados e o erro por campo; segue para o estado do pedido. */
export default function CompanyRegistrationPage() {
  const { refreshCompanyStatus } = useSession();
  const navigate = useNavigate();
  const form = useFormSubmission();
  const locations = useLocations();
  const [values, setValues] = useState<CompanyForm>(EMPTY_COMPANY_FORM);

  const set = (field: keyof CompanyForm) => (value: string) =>
    setValues((current) => ({ ...current, [field]: value }));

  const register = async () => {
    try {
      await companyService.register(toCompanyRequest(values));
    } catch (caught) {
      if (!isCompanyAlreadyRegistered(caught)) {
        throw caught;
      }
    }
    await refreshCompanyStatus();
    await navigate(paths.companyStatus);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    void form.submit(event, validateCompany(values), register);
  };

  const locationOptions = (locations.data ?? []).map((item) => ({
    value: item.id,
    label: item.name,
  }));

  return (
    <main className="auth-page">
      <form className="auth-card wide" onSubmit={handleSubmit} noValidate>
        <h1>Registo da Empresa</h1>
        <p className="auth-subtitle">Indique os dados da Empresa para pedir a aprovação.</p>
        <FormBanner banner={form.banner} busy={form.busy} />
        <TextField
          id="companyName"
          label="Nome da Empresa"
          value={values.companyName}
          onChange={set('companyName')}
          error={form.errors.companyName}
        />
        <TextField
          id="taxId"
          label="NIF"
          inputMode="numeric"
          value={values.taxId}
          onChange={set('taxId')}
          error={form.errors.taxId}
        />
        <SelectField
          id="industry"
          label="Área de atividade"
          placeholder="Escolha uma área"
          options={industryOptions}
          value={values.industry}
          onChange={(value) =>
            setValues((current) => ({ ...current, industry: value as Industry }))
          }
          error={form.errors.industry}
        />
        <TextField
          id="address"
          label="Morada"
          autoComplete="street-address"
          value={values.address}
          onChange={set('address')}
          error={form.errors.address}
        />
        <SelectField
          id="locationId"
          label="Localidade"
          placeholder={locations.loading ? 'A carregar…' : 'Escolha uma localidade'}
          options={locationOptions}
          value={values.locationId}
          disabled={locations.loading || locations.error !== null}
          onChange={set('locationId')}
          error={form.errors.locationId}
        />
        {locations.error && (
          <div role="alert" className="form-banner">
            <p>{locations.error.message}</p>
            <button type="button" onClick={locations.reload}>
              Tentar de novo
            </button>
          </div>
        )}
        <TextField
          id="contactEmail"
          label="E-mail de contacto"
          type="email"
          value={values.contactEmail}
          onChange={set('contactEmail')}
          error={form.errors.contactEmail}
        />
        <TextField
          id="contactPhone"
          label="Telefone de contacto"
          type="text"
          inputMode="tel"
          autoComplete="tel"
          value={values.contactPhone}
          onChange={set('contactPhone')}
          error={form.errors.contactPhone}
        />
        <TextField
          id="responsibleName"
          label="Nome do responsável"
          autoComplete="name"
          value={values.responsibleName}
          onChange={set('responsibleName')}
          error={form.errors.responsibleName}
        />
        <SubmitButton busy={form.busy}>Pedir aprovação</SubmitButton>
        <p className="auth-links">
          <SignOutButton />
        </p>
      </form>
    </main>
  );
}
