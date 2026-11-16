import type { IApiClient } from '../api/IApiClient';
import { ApiError } from '../api/ApiError';
import { indicators } from '../../test/fixtures';
import { IndicatorService } from './IndicatorService';

// I074 — pedido do IndicatorService (API v02, 6.12.1).
const fakeApi = () => ({ get: jest.fn() }) as unknown as jest.Mocked<IApiClient>;

describe('IndicatorService', () => {
  it('usa GET /api/admin/indicators com from e to em aaaa-MM-dd e devolve o DTO', async () => {
    const api = fakeApi();
    const dto = indicators();
    api.get.mockResolvedValue(dto);

    const result = await new IndicatorService(api).get('2026-10-01', '2026-10-31');

    expect(api.get).toHaveBeenCalledWith('/api/admin/indicators?from=2026-10-01&to=2026-10-31');
    expect(result).toBe(dto);
  });

  it('propaga o erro do cliente da API', async () => {
    const api = fakeApi();
    const error = new ApiError(400, 'Período inválido.', 'ERR-10');
    api.get.mockRejectedValue(error);

    await expect(new IndicatorService(api).get('2026-10-31', '2026-10-01')).rejects.toBe(error);
  });
});
