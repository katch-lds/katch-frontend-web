import type { ApiError } from '../api/ApiError';
import { ErrorAlert } from './ErrorAlert';

interface ActionFeedbackProps {
  /** Mensagem de sucesso da última ação. */
  notice: string | null;
  /** Falha da última ação. */
  failure?: ApiError | null;
  /** Com esta função, a falha tem «Tentar de novo» (por exemplo, ler a lista de novo). */
  onRetry?: () => void;
}

/** Resultado da última ação de uma lista: o aviso de sucesso (`role="status"`) e a falha (`role="alert"`). */
export function ActionFeedback({ notice, failure = null, onRetry }: Readonly<ActionFeedbackProps>) {
  return (
    <>
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      {failure && <ErrorAlert error={failure} onRetry={onRetry} />}
    </>
  );
}
