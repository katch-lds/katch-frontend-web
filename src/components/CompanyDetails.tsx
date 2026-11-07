import type { CompanyRegistrationDto } from '../types/api';
import { industryLabels } from '../types/labels';

// I069 — dados de registo da Empresa só de leitura (W05 e W26 do protótipo v02).

export function CompanyDetails({
  registration,
}: Readonly<{ registration: CompanyRegistrationDto }>) {
  const rows: [string, string][] = [
    ['Nome da Empresa', registration.companyName],
    ['NIF', registration.taxId],
    ['Área de atividade', industryLabels[registration.industry]],
    ['Morada', registration.address],
    ['Localidade', registration.locationName],
    ['E-mail de contacto', registration.contactEmail],
    ['Telefone de contacto', registration.contactPhone],
    ['Nome do responsável', registration.responsibleName],
  ];
  return (
    <dl className="company-details">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
