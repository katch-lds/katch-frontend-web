import { useCallback, useMemo, useState } from 'react';
import { indicatorService } from '../services';
import type { IndicatorsDto } from '../types/api';
import { addDays, periodDays, periodError as validatePeriod } from '../validation/admin';
import { todayLocal } from '../validation/jobs';
import { type IResourceState, useResource } from './useResource';

// I074 — useIndicators (modelo de classes do frontend web v02, secção 9): o período escolhido, validado antes do
// pedido à API (RF096), e os sete indicadores desse período.

/** Período por omissão (não definido na documentação): os últimos 30 dias, de hoje − 29 dias a hoje. */
const DEFAULT_PERIOD_DAYS = 30;

export interface Indicators extends IResourceState<IndicatorsDto> {
  from: string;
  to: string;
  periodDays: number;
  /** Erro do período (local ou ERR-10 do servidor); com ele não há indicadores a mostrar. */
  periodError: string | null;
  /** Valida e aplica o período; com o mesmo período já aplicado, repete o pedido. */
  applyPeriod: (from: string, to: string) => void;
}

interface Period {
  from: string;
  to: string;
}

function defaultPeriod(): Period {
  const to = todayLocal();
  return { from: addDays(to, 1 - DEFAULT_PERIOD_DAYS), to };
}

/** Só o período aplicado, sempre válido, chega ao serviço; o período por omissão é válido por construção. */
export function useIndicators(): Indicators {
  const [applied, setApplied] = useState<Period>(defaultPeriod);
  const [localError, setLocalError] = useState<string | null>(null);
  const load = useCallback(() => indicatorService.get(applied.from, applied.to), [applied]);
  const resource = useResource(load);
  const { reload } = resource;

  const applyPeriod = useCallback(
    (from: string, to: string) => {
      const error = validatePeriod(from, to, todayLocal());
      setLocalError(error);
      if (error !== null) {
        return;
      }
      // Novo objeto e `reload` juntos: um período novo muda o `load`, o mesmo período repete o pedido.
      setApplied({ from, to });
      reload();
    },
    [reload],
  );

  const serverError = resource.error;
  const isPeriodRejection = serverError?.httpStatus === 400 && serverError.code === 'ERR-10';
  const serverPeriodError = useMemo(() => {
    if (!isPeriodRejection || serverError === null) {
      return null;
    }
    const reasons = serverError.fields.map((field) => field.reason);
    return [serverError.message, ...reasons].join(' ');
  }, [isPeriodRejection, serverError]);

  return {
    ...resource,
    error: isPeriodRejection ? null : serverError,
    from: applied.from,
    to: applied.to,
    periodDays: periodDays(applied.from, applied.to),
    periodError: localError ?? serverPeriodError,
    applyPeriod,
  };
}
