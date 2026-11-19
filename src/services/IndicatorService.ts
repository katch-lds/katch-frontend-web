import type { IApiClient } from '../api/IApiClient';
import type { IndicatorsDto } from '../types/api';

export interface IIndicatorService {
  get(from: string, to: string): Promise<IndicatorsDto>;
}

/** Indicadores da plataforma, para o Administrador (AdminIndicatorsController; API v02, 6.12.1). */
export class IndicatorService implements IIndicatorService {
  constructor(private readonly api: IApiClient) {}

  /** Datas `aaaa-MM-dd`, inclusivas; 400 ERR-10 se faltam, estão mal formadas, `from > to` ou `to` é futura. */
  get(from: string, to: string): Promise<IndicatorsDto> {
    const query = new URLSearchParams({ from, to });
    return this.api.get<IndicatorsDto>(`/api/admin/indicators?${query.toString()}`);
  }
}
