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

  describe('decisão sobre o interesse (I072)', () => {
    const base = '/api/recruiter/interests/m%2F1%20a';
    const apiMock = () =>
      ({
        get: jest.fn(),
        post: jest.fn(),
        getFile: jest.fn(),
      }) as unknown as jest.Mocked<IApiClient>;

    it('openProfile pede o perfil com o matchId codificado', async () => {
      const api = apiMock();
      const profile = { matchId: 'm/1 a' };
      api.get.mockResolvedValue(profile);

      expect(await new CandidateEvaluationService(api).openProfile('m/1 a')).toBe(profile);
      expect(api.get).toHaveBeenCalledWith(`${base}/profile`);
    });

    it('getCv devolve o Blob do ficheiro autenticado', async () => {
      const api = apiMock();
      const blob = new Blob(['pdf']);
      api.getFile.mockResolvedValue(blob);

      expect(await new CandidateEvaluationService(api).getCv('m/1 a')).toBe(blob);
      expect(api.getFile).toHaveBeenCalledWith(`${base}/cv`);
    });

    it('accept faz POST sem corpo e devolve o match', async () => {
      const api = apiMock();
      const match = { matchId: 'm/1 a' };
      api.post.mockResolvedValue(match);

      expect(await new CandidateEvaluationService(api).accept('m/1 a')).toBe(match);
      expect(api.post).toHaveBeenCalledWith(`${base}/accept`);
    });

    it('reject faz POST sem corpo', async () => {
      const api = apiMock();
      api.post.mockResolvedValue(undefined);

      await new CandidateEvaluationService(api).reject('m/1 a');

      expect(api.post).toHaveBeenCalledWith(`${base}/reject`);
    });
  });
});
