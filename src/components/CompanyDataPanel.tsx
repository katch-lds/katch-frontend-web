import { useState } from 'react';
import type { CompanyRegistrationDto, CompanyRegistrationRequest } from '../types/api';
import { companyStatusLabels } from '../types/labels';
import { companyFormFrom } from '../validation/forms';
import { CompanyDataForm } from './CompanyDataForm';

// I121 — dados de registo da Empresa aprovada (W08, RF049): o NIF fica bloqueado.

interface CompanyDataPanelProps {
  registration: CompanyRegistrationDto | null;
  onSave: (request: CompanyRegistrationRequest) => Promise<void>;
}

export function CompanyDataPanel({ registration, onSave }: Readonly<CompanyDataPanelProps>) {
  const [saved, setSaved] = useState(false);
  if (registration === null) {
    return <p>Os dados de registo da Empresa não estão disponíveis.</p>;
  }
  const save = async (request: CompanyRegistrationRequest) => {
    setSaved(false);
    await onSave(request);
    setSaved(true);
  };
  return (
    <div className="stack">
      <p>
        Estado: <span className="status-badge status-approved">{companyStatusLabels.APPROVED}</span>
      </p>
      {saved && (
        <p role="status" className="form-notice">
          Dados guardados
        </p>
      )}
      <CompanyDataForm
        initialValues={companyFormFrom(registration)}
        submitLabel="Guardar alterações"
        taxIdLocked
        onSubmit={save}
      />
    </div>
  );
}
