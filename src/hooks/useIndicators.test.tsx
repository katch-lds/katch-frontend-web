import { act, renderHook, waitFor } from '@testing-library/react';
import { indicators } from '../../test/fixtures';
import { indicatorService, resetServiceMocks } from '../../test/servicesMock';
import { ApiError } from '../api/ApiError';
import { addDays } from '../validation/admin';
import { todayLocal } from '../validation/jobs';
import { useIndicators } from './useIndicators';

jest.mock('../services', () => jest.requireActual('../../test/servicesMock'));

const { get } = indicatorService;
const today = todayLocal();
const defaultFrom = addDays(today, -29);

beforeEach(() => resetServiceMocks());

describe('useIndicators', () => {
  it('pede ao montar os últimos 30 dias até hoje', async () => {
    const dto = indicators();
    get.mockResolvedValue(dto);
    const { result } = renderHook(() => useIndicators());

    await waitFor(() => expect(result.current.data).toBe(dto));

    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith(defaultFrom, today);
    expect(result.current.from).toBe(defaultFrom);
    expect(result.current.to).toBe(today);
    expect(result.current.periodDays).toBe(30);
    expect(result.current.periodError).toBeNull();
  });

  it('applyPeriod válido faz novo pedido com o novo período', async () => {
    const { result } = renderHook(() => useIndicators());
    await waitFor(() => expect(result.current.data).not.toBeNull());

    act(() => result.current.applyPeriod('2026-10-01', '2026-10-31'));

    await waitFor(() => expect(get).toHaveBeenLastCalledWith('2026-10-01', '2026-10-31'));
    expect(get).toHaveBeenCalledTimes(2);
    expect(result.current.periodDays).toBe(31);
    expect(result.current.periodError).toBeNull();
  });

  it('applyPeriod com o mesmo período repete o pedido', async () => {
    const { result } = renderHook(() => useIndicators());
    await waitFor(() => expect(result.current.data).not.toBeNull());

    act(() => result.current.applyPeriod(defaultFrom, today));

    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
    expect(get).toHaveBeenLastCalledWith(defaultFrom, today);
  });

  it('o mesmo período repetido depois de uma falha de ligação volta a pedir e recupera', async () => {
    get.mockRejectedValueOnce(ApiError.connectionFailure());
    const { result } = renderHook(() => useIndicators());
    await waitFor(() => expect(result.current.error?.isConnectionFailure()).toBe(true));
    expect(result.current.periodError).toBeNull();

    act(() => result.current.applyPeriod(defaultFrom, today));

    await waitFor(() => expect(result.current.data).not.toBeNull());
    expect(get).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBeNull();
  });

  it.each([
    ['2026-10-31', '2026-10-01', 'A data inicial tem de ser anterior ou igual à data final.'],
    ['2026-10-01', addDays(today, 1), 'A data final não pode ser posterior à data de hoje.'],
    ['', '2026-10-01', 'Indique a data inicial e a data final.'],
  ])('período inválido (%s, %s) não faz pedido e define periodError', async (from, to, message) => {
    const { result } = renderHook(() => useIndicators());
    await waitFor(() => expect(result.current.data).not.toBeNull());

    act(() => result.current.applyPeriod(from, to));

    expect(result.current.periodError).toBe(message);
    expect(get).toHaveBeenCalledTimes(1);
    expect(result.current.from).toBe(defaultFrom);
  });

  it('um período válido a seguir a um inválido limpa o erro', async () => {
    const { result } = renderHook(() => useIndicators());
    await waitFor(() => expect(result.current.data).not.toBeNull());
    act(() => result.current.applyPeriod('2026-10-31', '2026-10-01'));

    act(() => result.current.applyPeriod('2026-10-01', '2026-10-31'));

    expect(result.current.periodError).toBeNull();
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
  });

  it('descarta a resposta de um pedido ultrapassado', async () => {
    let resolveFirst: (value: ReturnType<typeof indicators>) => void = () => undefined;
    get.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFirst = resolve;
      }),
    );
    const latest = indicators({ activeCandidates: 99 });
    get.mockResolvedValueOnce(latest);
    const { result } = renderHook(() => useIndicators());

    act(() => result.current.applyPeriod('2026-10-01', '2026-10-31'));
    await waitFor(() => expect(result.current.data).toBe(latest));
    await act(async () => resolveFirst(indicators({ activeCandidates: 1 })));

    expect(result.current.data).toBe(latest);
  });

  it('reload repete o pedido do período aplicado', async () => {
    const { result } = renderHook(() => useIndicators());
    await waitFor(() => expect(result.current.data).not.toBeNull());

    act(() => result.current.reload());

    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
    expect(get).toHaveBeenLastCalledWith(defaultFrom, today);
  });

  it('um 400 ERR-10 do servidor aparece como erro do período, com o detalhe por campo', async () => {
    get.mockRejectedValue(
      new ApiError(400, 'Período inválido.', 'ERR-10', [
        { field: 'to', reason: 'A data final é posterior à atual.' },
      ]),
    );
    const { result } = renderHook(() => useIndicators());

    await waitFor(() =>
      expect(result.current.periodError).toBe(
        'Período inválido. A data final é posterior à atual.',
      ),
    );
    expect(result.current.error).toBeNull();
  });

  it('outros erros do servidor ficam em error, não em periodError', async () => {
    get.mockRejectedValue(new ApiError(500, 'Ocorreu um erro inesperado. Tente de novo.', null));
    const { result } = renderHook(() => useIndicators());

    await waitFor(() => expect(result.current.error?.httpStatus).toBe(500));
    expect(result.current.periodError).toBeNull();
  });
});
