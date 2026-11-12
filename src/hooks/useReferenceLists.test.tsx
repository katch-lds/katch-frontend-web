import { act, renderHook, waitFor } from '@testing-library/react';
import { referenceListService, resetServiceMocks } from '../../test/servicesMock';
import { ApiError } from '../api/ApiError';
import { useReferenceLists } from './useReferenceLists';

jest.mock('../services', () => jest.requireActual('../../test/servicesMock'));

beforeEach(() => resetServiceMocks());

describe('useReferenceLists (Administrador)', () => {
  it('lê só as competências e os benefícios, não as localidades', async () => {
    const { result } = renderHook(() => useReferenceLists());
    await waitFor(() => expect(result.current.data).not.toBeNull());

    expect(result.current.data).toEqual({
      skills: [{ id: 'skill-1', name: 'Atendimento' }],
      benefits: [{ id: 'benefit-1', name: 'Refeição no local' }],
    });
    expect(referenceListService.listLocations).not.toHaveBeenCalled();
  });

  it.each([
    ['addSkill', 'addSkill', [{ name: 'Kubernetes' }]],
    ['renameSkill', 'renameSkill', ['skill-1', { name: 'Atendimento ao cliente' }]],
    ['addBenefit', 'addBenefit', [{ name: 'Horário flexível' }]],
    ['renameBenefit', 'renameBenefit', ['benefit-1', { name: 'Seguro de saúde' }]],
  ] as const)('%s chama o serviço e lê as listas de novo', async (operation, method, args) => {
    referenceListService[method].mockResolvedValue({ id: 'x', name: 'x' });
    const { result } = renderHook(() => useReferenceLists());
    await waitFor(() => expect(result.current.data).not.toBeNull());

    await act(async () => {
      await (result.current[operation] as (...values: unknown[]) => Promise<void>)(...args);
    });

    expect(referenceListService[method]).toHaveBeenCalledWith(...args);
    await waitFor(() => expect(referenceListService.listSkills).toHaveBeenCalledTimes(2));
    expect(referenceListService.listBenefits).toHaveBeenCalledTimes(2);
  });

  it('numa designação repetida propaga o erro e não lê as listas de novo', async () => {
    referenceListService.addSkill.mockRejectedValue(
      new ApiError(400, 'Os dados enviados não cumprem a validação automática.', 'ERR-10', [
        { field: 'name', reason: 'A designação já existe na lista.' },
      ]),
    );
    const { result } = renderHook(() => useReferenceLists());
    await waitFor(() => expect(result.current.data).not.toBeNull());

    await act(async () => {
      await expect(result.current.addSkill({ name: 'c#' })).rejects.toMatchObject({
        code: 'ERR-10',
      });
    });

    expect(referenceListService.listSkills).toHaveBeenCalledTimes(1);
  });
});
