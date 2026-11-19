/**
 * Parâmetros da aplicação.
 *
 * Os valores partilhados por vários módulos ou de alteração provável: a consulta periódica, a paginação, os limites
 * das imagens, o comprimento das mensagens e o período por omissão dos indicadores. Os comprimentos dos campos
 * espelham a validação da API e ficam em `validation/`.
 *
 * @returns As constantes exportadas.
 */

/** Intervalo da consulta periódica das conversas (P17; deliberação 1 da ata de 2026-10-16). */
export const POLLING_INTERVAL_MS = 3000;

/** Linhas por página das listas do Administrador (A06 e A07). */
export const ADMIN_PAGE_SIZE = 12;

/** Logótipo da Empresa (RF047). */
export const LOGO_MAX_MB = 2;

/** Galeria da Empresa (RF048). */
export const GALLERY_MAX_MB = 5;
export const GALLERY_MAX_PHOTOS = 6;

/** Fotografias da vaga (RF052). */
export const JOB_PHOTO_MAX_MB = 5;
export const MAX_JOB_PHOTOS = 5;

/** Comprimento máximo de uma mensagem (P03). */
export const MAX_MESSAGE_LENGTH = 1000;

/** Período por omissão dos indicadores (não definido na documentação): os últimos 30 dias, hoje incluído. */
export const DEFAULT_PERIOD_DAYS = 30;
