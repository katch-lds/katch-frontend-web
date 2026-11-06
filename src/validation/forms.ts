import type { CompanyRegistrationRequest, Industry, LoginRequest } from '../types/api';
import { industryLabels } from '../types/labels';
import {
  collectErrors,
  digitsError,
  emailError,
  type FieldErrors,
  passwordPolicyError,
  requiredText,
} from './fields';

// I069 — validação dos formulários de início de sessão, de criação de conta e de registo da Empresa.

/** No início de sessão, só se exige que os campos não estejam vazios: a política da palavra-passe não se aplica. */
export function validateLogin(values: LoginRequest): FieldErrors {
  return collectErrors({
    email: values.email.trim().length === 0 ? 'O e-mail é obrigatório.' : null,
    password: values.password.length === 0 ? 'A palavra-passe é obrigatória.' : null,
  });
}

export function validateAccount(values: {
  email: string;
  password: string;
  acceptTerms: boolean;
}): FieldErrors {
  return collectErrors({
    email: emailError(values.email),
    password: passwordPolicyError(values.password),
    acceptTerms: values.acceptTerms ? null : 'Tem de aceitar as condições de utilização.',
  });
}

/** O formulário da Empresa guarda a área de atividade como texto vazio enquanto nada foi escolhido. */
export interface CompanyForm extends Omit<CompanyRegistrationRequest, 'industry'> {
  industry: Industry | '';
}

export const EMPTY_COMPANY_FORM: CompanyForm = {
  companyName: '',
  taxId: '',
  industry: '',
  address: '',
  locationId: '',
  contactEmail: '',
  contactPhone: '',
  responsibleName: '',
};

function industryError(value: string): string | null {
  if (value === '') {
    return 'A área de atividade é obrigatória.';
  }
  return value in industryLabels ? null : 'A área de atividade escolhida não é válida.';
}

export function validateCompany(values: CompanyForm): FieldErrors {
  return collectErrors({
    companyName: requiredText(values.companyName, 'O nome da Empresa', 200),
    taxId: digitsError(values.taxId, 'O NIF', 9),
    industry: industryError(values.industry),
    address: requiredText(values.address, 'A morada', 255),
    locationId: values.locationId === '' ? 'A localidade é obrigatória.' : null,
    contactEmail: emailError(values.contactEmail, 'O e-mail de contacto'),
    contactPhone: digitsError(values.contactPhone, 'O telefone de contacto', 9),
    responsibleName: requiredText(values.responsibleName, 'O nome do responsável', 150),
  });
}

/** Pedido a enviar, com o texto aparado; só é chamado depois de a validação passar. */
export function toCompanyRequest(values: CompanyForm): CompanyRegistrationRequest {
  return {
    companyName: values.companyName.trim(),
    taxId: values.taxId.trim(),
    industry: values.industry as Industry,
    address: values.address.trim(),
    locationId: values.locationId,
    contactEmail: values.contactEmail.trim(),
    contactPhone: values.contactPhone.trim(),
    responsibleName: values.responsibleName.trim(),
  };
}
