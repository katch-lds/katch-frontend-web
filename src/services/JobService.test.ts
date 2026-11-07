import type { IApiClient } from '../api/IApiClient';
import { JobService } from './JobService';
import type { JobRequest } from '../types/api';

function fakeApi(): jest.Mocked<IApiClient> {
  return {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    upload: jest.fn(),
    getFile: jest.fn(),
  };
}

const request = { title: 'Empregado de mesa' } as JobRequest;

describe('JobService', () => {
  it('lista as vagas com GET /api/recruiter/jobs', async () => {
    const api = fakeApi();
    api.get.mockResolvedValue([]);

    await expect(new JobService(api).list()).resolves.toEqual([]);
    expect(api.get).toHaveBeenCalledWith('/api/recruiter/jobs');
  });

  it('cria com POST e altera com PUT', async () => {
    const api = fakeApi();
    const service = new JobService(api);

    await service.create(request);
    await service.update('job-1', request);

    expect(api.post).toHaveBeenCalledWith('/api/recruiter/jobs', request);
    expect(api.put).toHaveBeenCalledWith('/api/recruiter/jobs/job-1', request);
  });

  it.each([
    ['publish', '/api/recruiter/jobs/job-1/publish'],
    ['suspend', '/api/recruiter/jobs/job-1/suspend'],
    ['republish', '/api/recruiter/jobs/job-1/republish'],
    ['close', '/api/recruiter/jobs/job-1/close'],
  ] as const)('%s usa POST %s', async (operation, path) => {
    const api = fakeApi();

    await new JobService(api)[operation]('job-1');

    expect(api.post).toHaveBeenCalledWith(path);
  });

  it('elimina com DELETE e carrega a fotografia em multipart com POST', async () => {
    const api = fakeApi();
    api.upload.mockResolvedValue('/api/files/JOB_PHOTO/f.jpg');
    const service = new JobService(api);
    const file = new File(['x'], 'f.jpg', { type: 'image/jpeg' });

    await service.delete('job-1');
    const location = await service.addPhoto('job-1', file);

    expect(api.delete).toHaveBeenCalledWith('/api/recruiter/jobs/job-1');
    expect(api.upload).toHaveBeenCalledWith('POST', '/api/recruiter/jobs/job-1/photos', file);
    expect(location).toBe('/api/files/JOB_PHOTO/f.jpg');
  });
});
