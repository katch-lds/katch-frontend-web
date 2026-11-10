import { act, renderHook, waitFor } from '@testing-library/react';
import { candidateProfile, match } from '../../test/fixtures';
import { candidateEvaluationService, resetServiceMocks } from '../../test/servicesMock';
import { useCandidateProfile } from './useCandidateProfile';

jest.mock('../services', () => jest.requireActual('../../test/servicesMock'));

const { openProfile, accept, reject } = candidateEvaluationService;

beforeEach(() => {
  resetServiceMocks();
  openProfile.mockResolvedValue(candidateProfile());
});

describe('useCandidateProfile', () => {
  it('pede o perfil uma só vez, também depois de novos renders', async () => {
    const { result, rerender } = renderHook(() => useCandidateProfile('match-1'));
    await waitFor(() => expect(result.current.profileOpened).toBe(true));
    rerender();

    expect(openProfile).toHaveBeenCalledTimes(1);
  });

  it('accept e reject não atuam antes de o perfil estar carregado', async () => {
    openProfile.mockReturnValue(new Promise(() => undefined));
    const { result } = renderHook(() => useCandidateProfile('match-1'));

    await act(async () => {
      await result.current.accept();
      await result.current.reject();
    });

    expect(accept).not.toHaveBeenCalled();
    expect(reject).not.toHaveBeenCalled();
    expect(result.current.decision).toBe('idle');
  });

  it('depois de aceitar guarda o match e não é possível decidir de novo', async () => {
    const confirmed = match();
    accept.mockResolvedValue(confirmed);
    const { result } = renderHook(() => useCandidateProfile('match-1'));
    await waitFor(() => expect(result.current.profileOpened).toBe(true));

    await act(async () => {
      await result.current.accept();
    });
    await act(async () => {
      await result.current.accept();
      await result.current.reject();
    });

    expect(result.current.decision).toBe('accepted');
    expect(result.current.confirmedMatch).toBe(confirmed);
    expect(accept).toHaveBeenCalledTimes(1);
    expect(reject).not.toHaveBeenCalled();
  });

  it('dois pedidos em simultâneo enviam só um', async () => {
    reject.mockResolvedValue(undefined);
    const { result } = renderHook(() => useCandidateProfile('match-1'));
    await waitFor(() => expect(result.current.profileOpened).toBe(true));

    await act(async () => {
      await Promise.all([result.current.reject(), result.current.reject()]);
    });

    expect(reject).toHaveBeenCalledTimes(1);
    expect(result.current.decision).toBe('rejected');
  });
});
