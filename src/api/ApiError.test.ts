/**
 * @jest-environment node
 */
import { ApiError } from './ApiError';

describe('ApiError', () => {
  it('converte um ApiErrorDto com campos', () => {
    const error = ApiError.fromResponse(400, {
      code: 'ERR-10',
      message: 'Os dados enviados não cumprem a validação automática.',
      fields: [{ field: 'email', reason: 'O endereço já está registado.' }],
      blockedUntil: null,
    });

    expect(error.httpStatus).toBe(400);
    expect(error.code).toBe('ERR-10');
    expect(error.message).toBe('Os dados enviados não cumprem a validação automática.');
    expect(error.fieldReason('email')).toBe('O endereço já está registado.');
    expect(error.fieldReason('name')).toBeNull();
  });

  it('usa a mensagem genérica quando a resposta não traz ApiErrorDto', () => {
    const error = ApiError.fromResponse(502, '<html>Bad Gateway</html>');

    expect(error.code).toBeNull();
    expect(error.message).toBe('Ocorreu um erro inesperado. Tente de novo.');
    expect(error.fields).toEqual([]);
  });

  it.each([
    [401, 'isUnauthorized'],
    [403, 'isForbidden'],
    [409, 'isConflict'],
  ] as const)('classifica o código %i', (status, method) => {
    const error = new ApiError(status, 'x', null);

    expect(error[method]()).toBe(true);
    expect(error.isConnectionFailure()).toBe(false);
  });

  it('identifica a falha de ligação', () => {
    expect(ApiError.connectionFailure().isConnectionFailure()).toBe(true);
  });
});
