/**
 * @jest-environment node
 */
import type { IApiClient } from '../api/IApiClient';
import { CandidateEvaluationService } from './CandidateEvaluationService';

describe('CandidateEvaluationService', () => {
  it('pede os candidatos em espera com o jobId codificado e devolve a lista', async () => {
    const waiting = [{ matchId: 'match-1' }];
    const api = { get: jest.fn().mockResolvedValue(waiting) } as unknown as jest.Mocked<IApiClient>;

    const result = await new CandidateEvaluationService(api).listWaiting('job/1 a');

    expect(api.get).toHaveBeenCalledWith('/api/recruiter/jobs/job%2F1%20a/waiting-candidates');
    expect(result).toBe(waiting);
  });
});
