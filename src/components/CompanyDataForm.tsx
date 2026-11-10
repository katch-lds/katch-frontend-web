import { type FormEvent, useState } from 'react';
import { useFormSubmission } from '../hooks/useFormSubmission';
import { useLocations } from '../hooks/useLocations';
import type { CompanyRegistrationRequest, Industry } from '../types/api';
import { industryLabels } from '../types/labels';
import { type CompanyForm, toCompanyRequest, validateCompany } from '../validation/forms';
import { FormBanner } from './FormBanner';
import { SelectField } from './SelectField';
import { SubmitButton } from './SubmitButton';
import { TextField } from './TextField';

// I069 — formulário com os oito dados da Empresa, partilhado pelo registo (W03, W04) e pela nova submissão (W06).

const industryOptions = Object.entries(industryLabels).map(([value, label]) => ({ value, label }));

interface CompanyDataFormProps {
  initialValues: CompanyForm;
  submitLabel: string;
  /** Envia o pedido; um ApiError lançado aqui aparece no formulário (erro por campo no ERR-10). */
  onSubmit: (request: CompanyRegistrationRequest) => Promise<void>;
}

/** Campos, validação local, erro por campo e envio da Empresa. A localidade vem de `listLocations`. */
export function CompanyDataForm({
  initialValues,
  submitLabel,
  onSubmit,
}: Readonly<CompanyDataFormProps>) {
  const form = useFormSubmission();
  const locations = useLocations();
  const [values, setValues] = useState<CompanyForm>(initialValues);

  const set = (field: keyof CompanyForm) => (value: string) =>
    setValues((current) => ({ ...current, [field]: value }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    void form.submit(event, validateCompany(values), () => onSubmit(toCompanyRequest(values)));
  };

  const locationOptions = (locations.data ?? []).map((item) => ({
    value: item.id,
    label: item.name,
  }));

  return (
    <form className="stack" onSubmit={handleSubmit} noValidate>
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
        onChange={(value) => setValues((current) => ({ ...current, industry: value as Industry }))}
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
      <SubmitButton busy={form.busy}>{submitLabel}</SubmitButton>
    </form>
  );
}
