/**
 * @jest-environment node
 */
import type { IApiClient } from '../api/IApiClient';
import { JobService } from './JobService';

describe('JobService', () => {
  it('pede as vagas da Empresa em GET /api/recruiter/jobs', async () => {
    const jobs = [{ jobId: 'job-1' }];
    const api = { get: jest.fn().mockResolvedValue(jobs) } as unknown as jest.Mocked<IApiClient>;

    await expect(new JobService(api).list()).resolves.toBe(jobs);

    expect(api.get).toHaveBeenCalledWith('/api/recruiter/jobs');
  });
});
