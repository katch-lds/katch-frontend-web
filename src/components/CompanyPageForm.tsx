import { type FormEvent, useState } from 'react';
import { useFormSubmission } from '../hooks/useFormSubmission';
import type { CompanyPageDto, CompanyPageRequest } from '../types/api';
import {
  type CompanyPageForm as CompanyPageValues,
  companyPageFormFrom,
  MAX_PAGE_DESCRIPTION_LENGTH,
  toCompanyPageRequest,
  validateCompanyPage,
} from '../validation/company';
import { FormBanner } from './FormBanner';
import { FormField } from './FormField';
import { SubmitButton } from './SubmitButton';
import { TextField } from './TextField';

// I121 — descrição e sítio na Internet da página da Empresa (W07, RF046).

interface CompanyPageFormProps {
  page: CompanyPageDto;
  onSave: (request: CompanyPageRequest) => Promise<void>;
}

export function CompanyPageForm({ page, onSave }: Readonly<CompanyPageFormProps>) {
  const form = useFormSubmission();
  const [values, setValues] = useState<CompanyPageValues>(() => companyPageFormFrom(page));
  const [saved, setSaved] = useState(false);

  const set = (field: keyof CompanyPageValues) => (value: string) => {
    setSaved(false);
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    void form.submit(event, validateCompanyPage(values), async () => {
      setSaved(false);
      await onSave(toCompanyPageRequest(values));
      setSaved(true);
    });
  };

  return (
    <form className="stack" onSubmit={handleSubmit} noValidate>
      <FormBanner banner={form.banner} busy={form.busy} />
      <FormField id="description" label="Descrição" error={form.errors.description}>
        {(control) => (
          <textarea
            {...control}
            rows={5}
            value={values.description}
            onChange={(event) => set('description')(event.target.value)}
          />
        )}
      </FormField>
      <p className="note">{`${values.description.length}/${MAX_PAGE_DESCRIPTION_LENGTH}`}</p>
      <TextField
        id="website"
        label="Sítio na Internet"
        placeholder="https://"
        value={values.website}
        onChange={set('website')}
        error={form.errors.website}
      />
      <p className="note">Começa por http:// ou https://</p>
      {saved && (
        <p role="status" className="form-notice">
          Página guardada
        </p>
      )}
      <SubmitButton busy={form.busy}>Guardar</SubmitButton>
    </form>
  );
}
