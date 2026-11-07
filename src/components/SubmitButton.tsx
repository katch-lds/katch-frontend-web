import type { ReactNode } from 'react';

// I069 — botão de envio desativado durante o pedido, para evitar pedidos duplicados.

export function SubmitButton({ busy, children }: Readonly<{ busy: boolean; children: ReactNode }>) {
  return (
    <button type="submit" className="primary" disabled={busy} aria-busy={busy}>
      {busy ? 'A enviar…' : children}
    </button>
  );
}
