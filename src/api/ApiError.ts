import type { ApiErrorDto, FieldErrorDto } from '../types/api';

/** Erro de um pedido à API (modelo de classes do frontend web v02, secções 4.1 e 4.2). */
export class ApiError extends Error {
  readonly httpStatus: number;

  readonly code: string | null;

  readonly fields: FieldErrorDto[];

  constructor(
    httpStatus: number,
    message: string,
    code: string | null,
    fields: FieldErrorDto[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
    this.httpStatus = httpStatus;
    this.code = code;
    this.fields = fields;
  }

  /** Erro sem resposta do servidor (tempo limite ou falha de rede). */
  static connectionFailure(): ApiError {
    return new ApiError(
      0,
      'Não foi possível contactar o servidor. Verifique a ligação e tente de novo.',
      null,
    );
  }

  /**
   * Garante um ApiError para qualquer falha apanhada. O resto (por exemplo, um corpo de sucesso que não é JSON) é
   * tratado como resposta inesperada, com a mensagem genérica, e não como falha de ligação.
   */
  static from(error: unknown): ApiError {
    return error instanceof ApiError ? error : ApiError.fromResponse(500, null);
  }

  /** Converte o corpo de uma resposta de erro; sem ApiErrorDto, fica a mensagem genérica e code a null. */
  static fromResponse(httpStatus: number, body: unknown): ApiError {
    if (isApiErrorDto(body)) {
      return new ApiError(httpStatus, body.message, body.code, body.fields ?? []);
    }
    return new ApiError(httpStatus, 'Ocorreu um erro inesperado. Tente de novo.', null);
  }

  fieldReason(field: string): string | null {
    return this.fields.find((f) => f.field === field)?.reason ?? null;
  }

  isUnauthorized(): boolean {
    return this.httpStatus === 401;
  }

  isForbidden(): boolean {
    return this.httpStatus === 403;
  }

  isConflict(): boolean {
    return this.httpStatus === 409;
  }

  isConnectionFailure(): boolean {
    return this.httpStatus === 0;
  }
}

function isApiErrorDto(body: unknown): body is ApiErrorDto {
  if (typeof body !== 'object' || body === null) {
    return false;
  }
  const candidate = body as Record<string, unknown>;
  return typeof candidate.message === 'string' && typeof candidate.code === 'string';
}
