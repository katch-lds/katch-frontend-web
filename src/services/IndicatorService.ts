import type { IApiClient } from '../api/IApiClient';
import type { IndicatorsDto } from '../types/api';

// I074 — IndicatorService (modelo de classes do frontend web v02, secção 5; API v02, 6.12.1).
export interface IIndicatorService {
  get(from: string, to: string): Promise<IndicatorsDto>;
}

/** Indicadores da plataforma, para o Administrador (AdminIndicatorsController). */
export class IndicatorService implements IIndicatorService {
  constructor(private readonly api: IApiClient) {}

  /** Datas `aaaa-MM-dd`, inclusivas; 400 ERR-10 se faltam, estão mal formadas, `from > to` ou `to` é futura. */
  get(from: string, to: string): Promise<IndicatorsDto> {
    const query = new URLSearchParams({ from, to });
    return this.api.get<IndicatorsDto>(`/api/admin/indicators?${query.toString()}`);
  }
}
