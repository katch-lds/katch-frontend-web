import { act, renderHook, waitFor } from '@testing-library/react';
import { candidateAdmin } from '../../test/fixtures';
import { adminAccountService, resetServiceMocks } from '../../test/servicesMock';
import { useCandidatesAdmin } from './useCandidatesAdmin';

jest.mock('../services', () => jest.requireActual('../../test/servicesMock'));

const { listCandidates, suspendCandidate, reactivate } = adminAccountService;

beforeEach(() => {
  resetServiceMocks();
  listCandidates.mockResolvedValue([
    candidateAdmin(),
    candidateAdmin({ candidateId: 'candidate-2', fullName: 'Rui Matos', status: 'SUSPENDED' }),
    candidateAdmin({ candidateId: 'candidate-3', fullName: 'Marta Lopes', status: 'BLOCKED' }),
  ]);
});

describe('useCandidatesAdmin', () => {
  it('conta os Candidatos ativos', async () => {
    const { result } = renderHook(() => useCandidatesAdmin());
    await waitFor(() => expect(result.current.data).toHaveLength(3));

    expect(result.current.activeCount).toBe(1);
  });

  it('suspende com o candidateId e lê a lista de novo', async () => {
    suspendCandidate.mockResolvedValue(undefined);
    const { result } = renderHook(() => useCandidatesAdmin());
    await waitFor(() => expect(result.current.data).not.toBeNull());

    await act(async () => {
      await result.current.suspend('candidate-1');
    });

    expect(suspendCandidate).toHaveBeenCalledWith('candidate-1');
    await waitFor(() => expect(listCandidates).toHaveBeenCalledTimes(2));
  });

  it('reativa com o candidateId (o identificador da conta) e lê a lista de novo', async () => {
    reactivate.mockResolvedValue(undefined);
    const { result } = renderHook(() => useCandidatesAdmin());
    await waitFor(() => expect(result.current.data).not.toBeNull());

    await act(async () => {
      await result.current.reactivate('candidate-2');
    });

    expect(reactivate).toHaveBeenCalledWith('candidate-2');
    await waitFor(() => expect(listCandidates).toHaveBeenCalledTimes(2));
  });

  it('numa ação rejeitada propaga o erro e também lê a lista de novo', async () => {
    suspendCandidate.mockRejectedValue(new Error('falhou'));
    const { result } = renderHook(() => useCandidatesAdmin());
    await waitFor(() => expect(result.current.data).not.toBeNull());

    await act(async () => {
      await expect(result.current.suspend('candidate-1')).rejects.toThrow('falhou');
    });

    await waitFor(() => expect(listCandidates).toHaveBeenCalledTimes(2));
  });
});
