import type { ReactNode } from 'react';
import type { ApiError } from '../api/ApiError';

interface ErrorAlertProps {
  error: ApiError;
  /** Com esta função aparece «Tentar de novo», que repete o último pedido. */
  onRetry?: () => void;
  /** Estilo do ecrã: `alert` (por omissão) ou `form-banner`. */
  className?: string;
  /** Outras ações, depois de «Tentar de novo». */
  children?: ReactNode;
}

/** Erro com `role="alert"`: a mensagem do servidor, ou de falha de ligação (RNF018). */
export function ErrorAlert({
  error,
  onRetry,
  className = 'alert',
  children,
}: Readonly<ErrorAlertProps>) {
  return (
    <div role="alert" className={className}>
      <p>{error.message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          Tentar de novo
        </button>
      )}
      {children}
    </div>
  );
}
