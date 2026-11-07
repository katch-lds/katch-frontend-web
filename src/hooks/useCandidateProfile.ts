import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../api/ApiError';
import { candidateEvaluationService } from '../services';
import type { CandidateFullProfileDto, MatchDto } from '../types/api';
import { type IResourceState, useResource } from './useResource';

/** Tempo até revogar o endereço local do CV, depois de aberto no novo separador. */
export const CV_URL_LIFETIME_MS = 60_000;

export type DecisionState = 'idle' | 'submitting' | 'accepted' | 'rejected';

export interface ICandidateProfileState extends IResourceState<CandidateFullProfileDto> {
  /** Verdadeiro quando o perfil foi carregado com sucesso, ou seja, a abertura ficou registada (RF118). */
  profileOpened: boolean;
  decision: DecisionState;
  confirmedMatch: MatchDto | null;
  /** Erro da última decisão (ERR-08, ERR-20, ERR-34, ERR-35, ligação); não altera o estado da decisão. */
  decisionError: ApiError | null;
  cvError: ApiError | null;
  /** Devolve o match confirmado, ou null se a decisão não foi registada (ver `decisionError`). */
  accept: () => Promise<MatchDto | null>;
  reject: () => Promise<void>;
  openCv: () => Promise<void>;
}

interface InFlight {
  matchId: string;
  promise: Promise<CandidateFullProfileDto>;
}

/**
 * Perfil do candidato e decisão sobre o interesse (W17; RF061 a RF064, RF117, RF118). O pedido do perfil tem efeito
 * no servidor, por isso é feito uma só vez por `matchId` (também com o StrictMode); só «reload» o repete. O estado da
 * decisão pertence a um candidato: quem usa o hook remonta-o (`key`) quando o `matchId` muda.
 */
export function useCandidateProfile(matchId: string): ICandidateProfileState {
  const inFlight = useRef<InFlight | null>(null);
  const load = useCallback(() => {
    if (inFlight.current?.matchId !== matchId) {
      inFlight.current = { matchId, promise: candidateEvaluationService.openProfile(matchId) };
    }
    return inFlight.current.promise;
  }, [matchId]);
  const resource = useResource(load);
  const { reload: reloadResource } = resource;

  const [decision, setDecision] = useState<DecisionState>('idle');
  const [confirmedMatch, setConfirmedMatch] = useState<MatchDto | null>(null);
  const [decisionError, setDecisionError] = useState<ApiError | null>(null);
  const [cvError, setCvError] = useState<ApiError | null>(null);
  const locked = useRef(false);
  const cvBusy = useRef(false);
  const revokeTimers = useRef<number[]>([]);

  useEffect(
    () => () => {
      revokeTimers.current.forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  const profileOpened = resource.data !== null;

  const decide = useCallback(
    async <T>(action: () => Promise<T>, done: DecisionState): Promise<T | null> => {
      if (!profileOpened || locked.current) {
        return null;
      }
      locked.current = true;
      setDecisionError(null);
      setDecision('submitting');
      try {
        const result = await action();
        setDecision(done);
        return result;
      } catch (error: unknown) {
        // Sem decisão registada por este pedido: a decisão que existe no servidor, se existir, não muda (RF117).
        setDecisionError(ApiError.from(error));
        setDecision('idle');
        locked.current = false;
        return null;
      }
    },
    [profileOpened],
  );

  const accept = useCallback(async () => {
    const match = await decide(() => candidateEvaluationService.accept(matchId), 'accepted');
    if (match !== null) {
      setConfirmedMatch(match);
    }
    return match;
  }, [decide, matchId]);

  const reject = useCallback(async () => {
    await decide(() => candidateEvaluationService.reject(matchId), 'rejected');
  }, [decide, matchId]);

  const openCv = useCallback(async () => {
    if (!profileOpened || cvBusy.current || decision === 'accepted' || decision === 'rejected') {
      return;
    }
    cvBusy.current = true;
    setCvError(null);
    try {
      const blob = await candidateEvaluationService.getCv(matchId);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener');
      revokeTimers.current.push(
        window.setTimeout(() => URL.revokeObjectURL(url), CV_URL_LIFETIME_MS),
      );
    } catch (error: unknown) {
      setCvError(ApiError.from(error));
    } finally {
      cvBusy.current = false;
    }
  }, [profileOpened, decision, matchId]);

  const reload = useCallback(() => {
    inFlight.current = null;
    reloadResource();
  }, [reloadResource]);

  return {
    ...resource,
    reload,
    profileOpened,
    decision,
    confirmedMatch,
    decisionError,
    cvError,
    accept,
    reject,
    openCv,
  };
}
