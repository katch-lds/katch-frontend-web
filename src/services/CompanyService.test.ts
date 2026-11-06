import { companyRegistration, companyStatus } from '../../test/fixtures';
import { ApiError } from '../api/ApiError';
import type { IApiClient } from '../api/IApiClient';
import { CompanyService } from './CompanyService';

function fakeApi() {
  return { get: jest.fn(), post: jest.fn() } as unknown as jest.Mocked<IApiClient>;
}

describe('CompanyService', () => {
  it('regista a Empresa com POST /api/recruiter/company', async () => {
    const api = fakeApi();
    api.post.mockResolvedValue(companyStatus());

    const result = await new CompanyService(api).register(companyRegistration());

    expect(api.post).toHaveBeenCalledWith('/api/recruiter/company', companyRegistration());
    expect(result).toEqual(companyStatus());
  });

  it('lê o estado com GET /api/recruiter/company/status', async () => {
    const api = fakeApi();
    api.get.mockResolvedValue(companyStatus({ status: 'APPROVED' }));

    const result = await new CompanyService(api).getStatus();

    expect(api.get).toHaveBeenCalledWith('/api/recruiter/company/status');
    expect(result?.status).toBe('APPROVED');
  });

  it('converte o 404 ERR-20 (sem Empresa registada) em null', async () => {
    const api = fakeApi();
    api.get.mockRejectedValue(new ApiError(404, 'Empresa não encontrada.', 'ERR-20'));

    await expect(new CompanyService(api).getStatus()).resolves.toBeNull();
  });

  it.each([
    ['outro 404', new ApiError(404, 'Outro recurso.', 'ERR-21')],
    ['403', new ApiError(403, 'Proibido.', 'ERR-06')],
    ['falha de ligação', ApiError.connectionFailure()],
    ['erro inesperado', new Error('inesperado')],
  ])('propaga qualquer outro erro (%s)', async (_name, error) => {
    const api = fakeApi();
    api.get.mockRejectedValue(error);

    await expect(new CompanyService(api).getStatus()).rejects.toBe(error);
  });
});
