import type { IApiClient } from '../api/IApiClient';
import { AuthService } from './AuthService';

function fakeApi() {
  return { get: jest.fn(), post: jest.fn() } as unknown as jest.Mocked<IApiClient>;
}

describe('AuthService', () => {
  it('inicia sessão com POST /api/auth/login e devolve a resposta', async () => {
    const api = fakeApi();
    const response = { token: 't', expiresAt: 'x', userType: 'ADMIN', userId: 'u' };
    api.post.mockResolvedValue(response);

    const result = await new AuthService(api).login({ email: 'a@b.pt', password: 'Segredo123' });

    expect(api.post).toHaveBeenCalledWith('/api/auth/login', {
      email: 'a@b.pt',
      password: 'Segredo123',
    });
    expect(result).toBe(response);
  });

  it('cria a conta do Recrutador com POST /api/auth/recruiters', async () => {
    const api = fakeApi();
    api.post.mockResolvedValue({});
    const request = { email: 'a@b.pt', password: 'Segredo123', acceptTerms: true };

    await new AuthService(api).createRecruiterAccount(request);

    expect(api.post).toHaveBeenCalledWith('/api/auth/recruiters', request);
  });

  it('termina a sessão com POST /api/auth/logout, sem corpo', async () => {
    const api = fakeApi();
    api.post.mockResolvedValue(undefined);

    await new AuthService(api).logout();

    expect(api.post).toHaveBeenCalledWith('/api/auth/logout');
  });
});
