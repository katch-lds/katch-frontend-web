import type { CompanyPageDto, CompanyPageRequest } from '../types/api';
import { collectErrors, type FieldErrors } from './fields';

// Validação da página de apresentação da Empresa (RF046) e limites do logótipo e da galeria (RF047, RF048). O
// servidor volta a validar tudo.

export const MAX_PAGE_DESCRIPTION_LENGTH = 1000;
export const LOGO_MAX_MB = 2;
export const GALLERY_MAX_MB = 5;
export const GALLERY_MAX_PHOTOS = 6;

/** O formulário guarda o texto escrito; o texto vazio só vira `null` no pedido. */
export interface CompanyPageForm {
  description: string;
  website: string;
}

export function companyPageFormFrom(page: CompanyPageDto): CompanyPageForm {
  return { description: page.description ?? '', website: page.website ?? '' };
}

const WEBSITE_MESSAGE =
  'O sítio na Internet tem de começar por http:// ou https:// e ser um endereço válido.';

function websiteError(value: string): string | null {
  const text = value.trim();
  if (text.length === 0) {
    return null;
  }
  if (!/^https?:\/\//i.test(text)) {
    return WEBSITE_MESSAGE;
  }
  try {
    return new URL(text).hostname.length > 0 ? null : WEBSITE_MESSAGE;
  } catch {
    return WEBSITE_MESSAGE;
  }
}

export function validateCompanyPage(values: CompanyPageForm): FieldErrors {
  return collectErrors({
    description:
      values.description.trim().length > MAX_PAGE_DESCRIPTION_LENGTH
        ? `A descrição pode ter no máximo ${MAX_PAGE_DESCRIPTION_LENGTH} caracteres.`
        : null,
    website: websiteError(values.website),
  });
}

/** Pedido a enviar, com o texto aparado e o texto vazio a `null` (limpa o campo). */
export function toCompanyPageRequest(values: CompanyPageForm): CompanyPageRequest {
  return {
    description: values.description.trim() || null,
    website: values.website.trim() || null,
  };
}
