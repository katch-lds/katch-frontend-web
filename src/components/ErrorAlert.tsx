import type { ApiError } from '../api/ApiError';

// I073 — erro de carregamento de uma página, com «Tentar de novo» (RNF018: a falha de ligação é indicada antes do
// tempo limite de 10 segundos do cliente da API).

/** Mensagem do servidor (ou de falha de ligação) com `role="alert"`; «Tentar de novo» repete o último pedido. */
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
