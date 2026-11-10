import type { ContractType, JobDto, JobRequest, WorkMode } from '../types/api';
import { contractTypeLabels, workModeLabels } from '../types/labels';
import { collectErrors, type FieldErrors } from './fields';

// I070 — validação do formulário da vaga (RF050 a RF052). O servidor volta a validar tudo, incluindo o intervalo
// salarial (RF051), cuja recusa é apresentada com a mensagem da API junto do salário mínimo.

export const MAX_TITLE_LENGTH = 150;
export const MAX_DESCRIPTION_LENGTH = 5000;
export const MAX_SALARY = 99_999_999.99;
export const MAX_JOB_PHOTOS = 5;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const PHOTO_TYPES = ['image/jpeg', 'image/png'];

/** O formulário guarda o texto escrito; os números e a data só são convertidos no pedido. */
export interface JobForm {
  title: string;
  description: string;
  minSalary: string;
  maxSalary: string;
  locationId: string;
  contractType: ContractType | '';
  workMode: WorkMode | '';
  skillIds: string[];
  benefitIds: string[];
  isUrgent: boolean;
  /** Data local `aaaa-mm-dd` ou texto vazio (sem data-limite). */
  expiresAt: string;
}

export const EMPTY_JOB_FORM: JobForm = {
  title: '',
  description: '',
  minSalary: '',
  maxSalary: '',
  locationId: '',
  contractType: '',
  workMode: '',
  skillIds: [],
  benefitIds: [],
  isUrgent: false,
  expiresAt: '',
};

/** Aceita «1200», «1200.50» e «1200,50»; devolve null para qualquer outro texto. */
export function parseEuros(value: string): number | null {
  const text = value.trim().replace(',', '.');
  return /^\d+(\.\d+)?$/.test(text) ? Number(text) : null;
}

function salaryError(value: string, label: string): string | null {
  if (value.trim().length === 0) {
    return `${label} é obrigatório.`;
  }
  const amount = parseEuros(value);
  if (amount === null || amount <= 0) {
    return 'O valor tem de ser um número positivo em euros.';
  }
  if (Math.round(amount * 100) !== amount * 100) {
    return 'O valor tem de ter no máximo 2 casas decimais.';
  }
  return amount > MAX_SALARY ? 'O valor não pode exceder 99 999 999,99 euros.' : null;
}

function textError(value: string, label: string, max: number): string | null {
  const text = value.trim();
  if (text.length === 0) {
    return `${label} é obrigatória.`;
  }
  return text.length > max ? `${label} pode ter no máximo ${max} caracteres.` : null;
}

/** Data de hoje no fuso do browser, no formato `aaaa-mm-dd`. */
export function todayLocal(now: Date = new Date()): string {
  return toLocalDate(now);
}

function toLocalDate(instant: Date): string {
  const month = String(instant.getMonth() + 1).padStart(2, '0');
  const day = String(instant.getDate()).padStart(2, '0');
  return `${instant.getFullYear()}-${month}-${day}`;
}

/** A data-limite é o fim do dia local escolhido, em UTC (ISO 8601). */
export function expiresAtInstant(date: string): string {
  return new Date(`${date}T23:59:59`).toISOString();
}

export function validateJob(values: JobForm, now: Date = new Date()): FieldErrors {
  return collectErrors({
    title: textError(values.title, 'A função', MAX_TITLE_LENGTH),
    description: textError(values.description, 'A descrição', MAX_DESCRIPTION_LENGTH),
    minSalary: salaryError(values.minSalary, 'O salário mínimo'),
    maxSalary: salaryError(values.maxSalary, 'O salário máximo'),
    locationId: values.locationId === '' ? 'A localidade é obrigatória.' : null,
    contractType:
      values.contractType in contractTypeLabels ? null : 'O tipo de contrato é obrigatório.',
    workMode: values.workMode in workModeLabels ? null : 'O regime de trabalho é obrigatório.',
    skillIds: values.skillIds.length === 0 ? 'Escolha pelo menos uma competência.' : null,
    expiresAt:
      values.expiresAt !== '' && values.expiresAt < todayLocal(now)
        ? 'A data-limite tem de ser posterior ao momento atual.'
        : null,
  });
}

/** Pedido a enviar; só é chamado depois de a validação passar. */
export function toJobRequest(values: JobForm): JobRequest {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    minSalary: parseEuros(values.minSalary) ?? 0,
    maxSalary: parseEuros(values.maxSalary) ?? 0,
    locationId: values.locationId,
    contractType: values.contractType as ContractType,
    workMode: values.workMode as WorkMode,
    skillIds: values.skillIds,
    benefitIds: values.benefitIds,
    isUrgent: values.isUrgent,
    expiresAt: values.expiresAt === '' ? null : expiresAtInstant(values.expiresAt),
  };
}

/** Formulário de alteração preenchido com a vaga (W11). */
export function toJobForm(job: JobDto): JobForm {
  return {
    title: job.title,
    description: job.description,
    minSalary: String(job.minSalary),
    maxSalary: String(job.maxSalary),
    locationId: job.locationId,
    contractType: job.contractType,
    workMode: job.workMode,
    skillIds: job.skills.map((skill) => skill.id),
    benefitIds: job.benefits.map((benefit) => benefit.id),
    isUrgent: job.isUrgent,
    expiresAt: job.expiresAt === null ? '' : toLocalDate(new Date(job.expiresAt)),
  };
}

/** Formato e dimensão de uma fotografia antes do carregamento (secção 5, regra 8; RF052). */
export function photoError(file: File): string | null {
  if (!PHOTO_TYPES.includes(file.type)) {
    return `${file.name}: a fotografia tem de estar no formato JPEG ou PNG.`;
  }
  return file.size > MAX_PHOTO_BYTES ? `${file.name}: a fotografia pode ter no máximo 5 MB.` : null;
}

/** Erro de um campo, incluindo os erros por elemento da lista que a API devolve como `skillIds[0]`. */
export function listFieldError(errors: FieldErrors, field: string): string | undefined {
  if (errors[field]) {
    return errors[field];
  }
  const key = Object.keys(errors).find((name) => name.startsWith(`${field}[`));
  return key === undefined ? undefined : errors[key];
}
