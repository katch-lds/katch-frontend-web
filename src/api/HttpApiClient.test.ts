/**
 * @jest-environment node
 */
import { SessionStore } from '../session/SessionStore';
import { ApiError } from './ApiError';
import { ConnectionMonitor } from './ConnectionMonitor';
import { HttpApiClient } from './HttpApiClient';

function jsonResponse(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function setup(fetchFn: jest.Mock) {
  const session = new SessionStore();
  const monitor = new ConnectionMonitor();
  const client = new HttpApiClient({
    baseUrl: 'http://api.test/',
    timeoutMs: 50,
    session,
    monitor,
    fetchFn: fetchFn as unknown as typeof fetch,
  });
  return { client, session, monitor };
}

describe('HttpApiClient', () => {
  it('envia o cabeçalho X-Client-App e a credencial Bearer e devolve o JSON', async () => {
    const fetchFn = jest.fn().mockResolvedValue(jsonResponse(200, { status: 'APPROVED' }));
    const { client, session } = setup(fetchFn);
    session.setToken('abc');

    const result = await client.get<{ status: string }>('/api/recruiter/company/status');

    expect(result).toEqual({ status: 'APPROVED' });
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe('http://api.test/api/recruiter/company/status');
    const headers = init.headers as Headers;
    expect(headers.get('X-Client-App')).toBe('web');
    expect(headers.get('Authorization')).toBe('Bearer abc');
    expect(headers.get('Content-Type')).toBeNull();
  });

  it('envia o corpo em JSON sem credencial quando não há sessão', async () => {
    const fetchFn = jest.fn().mockResolvedValue(jsonResponse(200, { token: 't' }));
    const { client } = setup(fetchFn);

    await client.post('/api/auth/login', { email: 'a@b.pt', password: 'x' });

    const init = fetchFn.mock.calls[0][1];
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"email":"a@b.pt","password":"x"}');
    expect((init.headers as Headers).get('Content-Type')).toBe('application/json');
    expect((init.headers as Headers).get('Authorization')).toBeNull();
  });

  it('devolve undefined numa resposta 204 e aceita PUT e DELETE', async () => {
    const fetchFn = jest
      .fn()
      .mockImplementation(() => Promise.resolve(new Response(null, { status: 204 })));
    const { client } = setup(fetchFn);

    await expect(client.put('/api/x', { a: 1 })).resolves.toBeUndefined();
    await expect(client.delete('/api/x')).resolves.toBeUndefined();
    expect(fetchFn.mock.calls.map((c) => c[1].method)).toEqual(['PUT', 'DELETE']);
  });

  it('converte a resposta de erro em ApiError com o code', async () => {
    const fetchFn = jest.fn().mockResolvedValue(
      jsonResponse(409, {
        code: 'ERR-30',
        message: 'Já não é possível.',
        fields: [],
        blockedUntil: null,
      }),
    );
    const { client } = setup(fetchFn);

    const error = await client.post('/api/recruiter/jobs/1/close').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe('ERR-30');
    expect((error as ApiError).isConflict()).toBe(true);
  });

  it('usa a mensagem genérica quando o erro não traz JSON', async () => {
    const fetchFn = jest.fn().mockResolvedValue(new Response('falha', { status: 500 }));
    const { client } = setup(fetchFn);

    const error = (await client.get('/api/x').catch((e: unknown) => e)) as ApiError;

    expect(error.code).toBeNull();
    expect(error.httpStatus).toBe(500);
  });

  it('reporta a falha de ligação e lança ApiError sem resposta', async () => {
    const fetchFn = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    const { client, monitor } = setup(fetchFn);

    const error = (await client.get('/api/x').catch((e: unknown) => e)) as ApiError;

    expect(error.isConnectionFailure()).toBe(true);
    expect(monitor.isOnline()).toBe(false);
  });

  it('envia o ficheiro em multipart e devolve o cabeçalho Location', async () => {
    const fetchFn = jest
      .fn()
      .mockResolvedValue(
        new Response(null, { status: 201, headers: { Location: '/api/files/logos/a.png' } }),
      );
    const { client } = setup(fetchFn);
    const file = new File(['png'], 'a.png', { type: 'image/png' });

    const location = await client.upload('POST', '/api/recruiter/company/photos', file);

    expect(location).toBe('/api/files/logos/a.png');
    const init = fetchFn.mock.calls[0][1];
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get('file')).toBeInstanceOf(File);
    expect((init.headers as Headers).get('Content-Type')).toBeNull();
  });

  it('obtém um ficheiro protegido como Blob', async () => {
    const fetchFn = jest.fn().mockResolvedValue(new Response('pdf', { status: 200 }));
    const { client } = setup(fetchFn);

    const blob = await client.getFile('/api/recruiter/interests/1/cv');

    expect(await blob.text()).toBe('pdf');
  });
});
