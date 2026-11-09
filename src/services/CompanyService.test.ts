import {
  companyPageDto,
  companyRegistration,
  companyRegistrationDto,
  companyStatus,
} from '../../test/fixtures';
import { ApiError } from '../api/ApiError';
import type { IApiClient } from '../api/IApiClient';
import { CompanyService } from './CompanyService';

function fakeApi() {
  return {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    upload: jest.fn(),
  } as unknown as jest.Mocked<IApiClient>;
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

  it('lê os dados de registo com GET /api/recruiter/company', async () => {
    const api = fakeApi();
    api.get.mockResolvedValue(companyRegistrationDto());

    const result = await new CompanyService(api).getRegistration();

    expect(api.get).toHaveBeenCalledWith('/api/recruiter/company');
    expect(result).toEqual(companyRegistrationDto());
  });

  it('getRegistration converte o 404 ERR-20 em null e propaga os outros erros', async () => {
    const api = fakeApi();
    api.get.mockRejectedValueOnce(new ApiError(404, 'Empresa não encontrada.', 'ERR-20'));
    const service = new CompanyService(api);

    await expect(service.getRegistration()).resolves.toBeNull();

    const failure = ApiError.connectionFailure();
    api.get.mockRejectedValueOnce(failure);
    await expect(service.getRegistration()).rejects.toBe(failure);
  });

  it('submete de novo com POST /api/recruiter/company/resubmission e os oito dados', async () => {
    const api = fakeApi();
    api.post.mockResolvedValue(companyStatus());

    const result = await new CompanyService(api).resubmit(companyRegistration());

    expect(api.post).toHaveBeenCalledWith(
      '/api/recruiter/company/resubmission',
      companyRegistration(),
    );
    expect(result).toEqual(companyStatus());
  });

  it('altera os dados de registo com PUT /api/recruiter/company e o corpo completo', async () => {
    const api = fakeApi();
    api.put.mockResolvedValue(companyStatus({ status: 'APPROVED' }));

    const result = await new CompanyService(api).updateRegistration(companyRegistration());

    expect(api.put).toHaveBeenCalledWith('/api/recruiter/company', companyRegistration());
    expect(result.status).toBe('APPROVED');
  });

  it('lê a página com GET /api/recruiter/company/page', async () => {
    const api = fakeApi();
    api.get.mockResolvedValue(companyPageDto());

    const result = await new CompanyService(api).getPage();

    expect(api.get).toHaveBeenCalledWith('/api/recruiter/company/page');
    expect(result).toEqual(companyPageDto());
  });

  it('grava a página com PUT /api/recruiter/company/page', async () => {
    const api = fakeApi();
    api.put.mockResolvedValue(companyPageDto());
    const request = { description: 'Café no centro.', website: null };

    await new CompanyService(api).updatePage(request);

    expect(api.put).toHaveBeenCalledWith('/api/recruiter/company/page', request);
  });

  it('carrega o logótipo com PUT multipart em /api/recruiter/company/logo', async () => {
    const api = fakeApi();
    api.upload.mockResolvedValue('/api/files/COMPANY_LOGO/a.png');
    const file = new File(['x'], 'logo.png', { type: 'image/png' });

    const location = await new CompanyService(api).uploadLogo(file);

    expect(api.upload).toHaveBeenCalledWith('PUT', '/api/recruiter/company/logo', file);
    expect(location).toBe('/api/files/COMPANY_LOGO/a.png');
  });

  it('acrescenta uma fotografia com POST multipart em /api/recruiter/company/photos', async () => {
    const api = fakeApi();
    api.upload.mockResolvedValue(null);
    const file = new File(['x'], 'sala.jpg', { type: 'image/jpeg' });

    await new CompanyService(api).addGalleryPhoto(file);

    expect(api.upload).toHaveBeenCalledWith('POST', '/api/recruiter/company/photos', file);
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
