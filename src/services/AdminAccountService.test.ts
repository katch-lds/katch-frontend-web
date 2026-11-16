import type { IApiClient } from '../api/IApiClient';
import { AdminAccountService } from './AdminAccountService';

// I073 — pedidos do AdminAccountService (API v02, 6.10).
function fakeApi() {
  return {
    get: jest.fn(),
    post: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<IApiClient>;
}

describe('AdminAccountService', () => {
  it('lista as contas com GET /api/admin/accounts', async () => {
    const api = fakeApi();
    const accounts = [
      { userId: 'u1', email: 'ana.ferreira@exemplo.pt', userType: 'CANDIDATE', status: 'ACTIVE' },
    ];
    api.get.mockResolvedValue(accounts);

    const result = await new AdminAccountService(api).listAccounts();

    expect(api.get).toHaveBeenCalledWith('/api/admin/accounts');
    expect(result).toBe(accounts);
  });

  it('lista os Candidatos com GET /api/admin/accounts/candidates', async () => {
    const api = fakeApi();
    api.get.mockResolvedValue([]);

    await new AdminAccountService(api).listCandidates();

    expect(api.get).toHaveBeenCalledWith('/api/admin/accounts/candidates');
  });

  it('bloqueia com POST /api/admin/accounts/{userId}/block, sem corpo', async () => {
    const api = fakeApi();

    await expect(new AdminAccountService(api).block('u 1')).resolves.toBeUndefined();

    expect(api.post).toHaveBeenCalledWith('/api/admin/accounts/u%201/block');
  });

  it('suspende o Candidato com POST /api/admin/accounts/candidates/{candidateId}/suspend', async () => {
    const api = fakeApi();

    await new AdminAccountService(api).suspendCandidate('c1');

    expect(api.post).toHaveBeenCalledWith('/api/admin/accounts/candidates/c1/suspend');
  });

  it('reativa com POST /api/admin/accounts/{userId}/reactivate', async () => {
    const api = fakeApi();

    await new AdminAccountService(api).reactivate('u1');

    expect(api.post).toHaveBeenCalledWith('/api/admin/accounts/u1/reactivate');
  });

  it('propaga o erro do servidor (por exemplo, 409 ERR-30)', async () => {
    const api = fakeApi();
    const failure = new Error('ERR-30');
    api.post.mockRejectedValue(failure);

    await expect(new AdminAccountService(api).block('u1')).rejects.toBe(failure);
  });
});
