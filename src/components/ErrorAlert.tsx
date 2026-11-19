import type { ApiError } from '../api/ApiError';

/**
 * Erro de carregamento de uma página: mensagem do servidor, ou de falha de ligação (RNF018), com `role="alert"`;
 * «Tentar de novo» repete o último pedido.
 */
export function ErrorAlert({ error, onRetry }: Readonly<{ error: ApiError; onRetry: () => void }>) {
  return (
    <div role="alert" className="alert">
      <p>{error.message}</p>
      <button type="button" onClick={onRetry}>
        Tentar de novo
      </button>
    </div>
  );
}
