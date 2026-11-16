import { useEffect, useId, useRef, useState } from 'react';
import { useFormSubmission } from '../hooks/useFormSubmission';
import { MAX_REASON_LENGTH, MIN_REASON_LENGTH, rejectionReasonError } from '../validation/admin';
import { FormBanner } from './FormBanner';
import { FormField } from './FormField';
import { SubmitButton } from './SubmitButton';

// I073 — ReasonDialog (modelo de classes do frontend web v02, secção 8.1; ecrãs A04c e A04d): pede o motivo da
// recusa do registo, de 10 a 500 caracteres (P12), validado antes do pedido; o erro ERR-10 do servidor aparece no campo.

interface ReasonDialogProps {
  title: string;
  confirmLabel: string;
  /** Envia o motivo; uma falha (ApiError) é mostrada no campo ou no aviso, e o diálogo fica aberto. */
  onConfirm: (reason: string) => Promise<void>;
  onCancel: () => void;
}

export function ReasonDialog({
  title,
  confirmLabel,
  onConfirm,
  onCancel,
}: Readonly<ReasonDialogProps>) {
  const titleId = useId();
  const fieldId = useId();
  const [reason, setReason] = useState('');
  const { busy, errors, banner, submit } = useFormSubmission();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const length = reason.trim().length;
  return (
    <div className="dialog-backdrop">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="dialog"
        noValidate
        onKeyDown={(event) => {
          if (event.key === 'Escape' && !busy) {
            onCancel();
          }
        }}
        onSubmit={(event) => {
          const error = rejectionReasonError(reason);
          void submit(event, error ? { reason: error } : {}, () => onConfirm(reason.trim()));
        }}
      >
        <h2 id={titleId}>{title}</h2>
        <FormBanner banner={banner} busy={busy} />
        <FormField id={fieldId} label="Motivo da recusa" error={errors.reason}>
          {(control) => (
            <textarea
              {...control}
              ref={textareaRef}
              rows={5}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          )}
        </FormField>
        <p className="note">
          {length} de {MAX_REASON_LENGTH} caracteres (mínimo {MIN_REASON_LENGTH})
        </p>
        <div className="dialog-actions">
          <SubmitButton busy={busy}>{confirmLabel}</SubmitButton>
          <button type="button" disabled={busy} onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
