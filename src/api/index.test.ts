/**
 * @jest-environment node
 */
import { ApiError } from './ApiError';
import { apiClient, onApiError } from '.';

describe('apiClient', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('entrega cada erro da API a quem subscreveu, como o ERR-07 que o SessionProvider trata', async () => {
    const body = { code: 'ERR-07', message: 'Empresa não aprovada.' };
    globalThis.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify(body), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
    ) as unknown as typeof fetch;
    const listener = jest.fn();
    const unsubscribe = onApiError(listener);

    await expect(apiClient.get('/api/companies/me/page')).rejects.toBeInstanceOf(ApiError);
    unsubscribe();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0]).toMatchObject({ httpStatus: 403, code: 'ERR-07' });
  });
});
