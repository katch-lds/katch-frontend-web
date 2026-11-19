import type { SubmissionBanner } from '../hooks/useFormSubmission';

/**
 * Aviso de erro no topo do formulário (`role="alert"`); quando o pedido não chegou ao servidor, «Tentar de novo»
 * volta a enviar o formulário.
 */
export function FormBanner({
  banner,
  busy,
}: Readonly<{ banner: SubmissionBanner | null; busy: boolean }>) {
  if (banner === null) {
    return null;
  }
  return (
    <div role="alert" className="form-banner">
      <p>{banner.message}</p>
      {banner.canRetry && (
        <button type="submit" disabled={busy}>
          Tentar de novo
        </button>
      )}
    </div>
  );
}
