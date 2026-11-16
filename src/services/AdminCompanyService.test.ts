import type { IApiClient } from '../api/IApiClient';
import { AdminCompanyService } from './AdminCompanyService';

// I073 — pedidos do AdminCompanyService (API v02, 6.11).
function fakeApi() {
  return {
    get: jest.fn(),
    post: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<IApiClient>;
}

describe('AdminCompanyService', () => {
  it.each([
    ['listPending', '/api/admin/companies/pending'],
    ['listCompanies', '/api/admin/companies'],
    ['listPublishedJobs', '/api/admin/companies/published-jobs'],
  ] as const)('%s usa GET %s e devolve a lista', async (operation, path) => {
    const api = fakeApi();
    const rows = [{ companyId: 'c1' }];
    api.get.mockResolvedValue(rows);

    const result = await new AdminCompanyService(api)[operation]();

    expect(api.get).toHaveBeenCalledWith(path);
    expect(result).toBe(rows);
  });

  it('getSubmittedData usa GET /api/admin/companies/{companyId}/registration', async () => {
    const api = fakeApi();
    const registration = { companyId: 'c 1', companyName: 'Lumen Software, Lda.' };
    api.get.mockResolvedValue(registration);

    const result = await new AdminCompanyService(api).getSubmittedData('c 1');

    expect(api.get).toHaveBeenCalledWith('/api/admin/companies/c%201/registration');
    expect(result).toBe(registration);
  });

  it.each([
    ['approve', '/api/admin/companies/c1/approve'],
    ['suspend', '/api/admin/companies/c1/suspend'],
    ['reactivate', '/api/admin/companies/c1/reactivate'],
  ] as const)('%s usa POST %s, sem corpo', async (operation, path) => {
    const api = fakeApi();

    await expect(new AdminCompanyService(api)[operation]('c1')).resolves.toBeUndefined();

    expect(api.post).toHaveBeenCalledWith(path);
  });

  it('reject usa POST /api/admin/companies/{companyId}/reject com o motivo no corpo', async () => {
    const api = fakeApi();
    const request = { reason: 'A morada indicada não corresponde à certidão permanente.' };

    await expect(new AdminCompanyService(api).reject('c1', request)).resolves.toBeUndefined();

    expect(api.post).toHaveBeenCalledWith('/api/admin/companies/c1/reject', request);
  });

  it('propaga o erro do servidor (por exemplo, 409 ERR-30)', async () => {
    const api = fakeApi();
    const failure = new Error('ERR-30');
    api.post.mockRejectedValue(failure);

    await expect(new AdminCompanyService(api).approve('c1')).rejects.toBe(failure);
  });
});
