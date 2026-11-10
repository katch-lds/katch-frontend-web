import { type ReactNode, useEffect, useId, useRef } from 'react';

// I070 — ConfirmDialog (modelo de classes do frontend web v02, secção 8.1; DF-11): confirmação antes de uma ação,
// com os efeitos, e rejeição com ação alternativa (W15).

interface ConfirmDialogProps {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  cancelLabel = 'Cancelar',
  busy = false,
  onConfirm,
  onCancel,
}: Readonly<ConfirmDialogProps>) {
  const titleId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  return (
    <div className="dialog-backdrop">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="dialog"
        onKeyDown={(event) => {
          if (event.key === 'Escape' && !busy) {
            onCancel();
          }
        }}
      >
        <h2 id={titleId}>{title}</h2>
        <div className="dialog-body">{children}</div>
        <div className="dialog-actions">
          <button
            ref={confirmRef}
            type="button"
            className="primary"
            disabled={busy}
            aria-busy={busy}
            onClick={onConfirm}
          >
            {busy ? 'A enviar…' : confirmLabel}
          </button>
          <button type="button" disabled={busy} onClick={onCancel}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
