import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../api/ApiError';
import { type FieldErrors, hasErrors } from '../validation/fields';

// I069 — envio de um formulário: validação local, erro por campo do servidor (ERR-10) e foco no primeiro campo em erro.

export interface SubmissionBanner {
  message: string;
  /** Falha de ligação: o formulário pode ser enviado de novo. */
  canRetry: boolean;
}

export interface FormSubmission {
  busy: boolean;
  errors: FieldErrors;
  banner: SubmissionBanner | null;
  /**
   * Trata o envio do formulário: com os erros locais já calculados e sem erros, corre `action`; um ApiError vira erro
   * do formulário. Guarda o formulário para pôr o foco no primeiro campo em erro.
   */
  submit: (
    event: FormEvent<HTMLFormElement>,
    local: FieldErrors,
    action: () => Promise<void>,
  ) => Promise<void>;
}

const FIELDS_MESSAGE = 'Corrija os campos indicados';

/** A API devolve os campos em camelCase; tolera-se a primeira letra em maiúscula. */
function fieldErrorsOf(error: ApiError): FieldErrors {
  const errors: FieldErrors = {};
  for (const { field, reason } of error.fields) {
    errors[field.charAt(0).toLowerCase() + field.slice(1)] = reason;
  }
  return errors;
}

function bannerOf(errors: FieldErrors, failure: ApiError | null): SubmissionBanner | null {
  if (hasErrors(errors)) {
    return { message: FIELDS_MESSAGE, canRetry: false };
  }
  return failure === null
    ? null
    : { message: failure.message, canRetry: failure.isConnectionFailure() };
}

export function useFormSubmission(): FormSubmission {
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<ApiError | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const sending = useRef(false);

  // Depois de um envio falhado, o foco vai para o primeiro campo em erro.
  useEffect(() => {
    if (hasErrors(errors)) {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    }
  }, [errors]);

  const submit = useCallback(
    async (event: FormEvent<HTMLFormElement>, local: FieldErrors, action: () => Promise<void>) => {
      event.preventDefault();
      formRef.current = event.currentTarget;
      if (sending.current) {
        return;
      }
      setFailure(null);
      setErrors(local);
      if (hasErrors(local)) {
        return;
      }
      sending.current = true;
      setBusy(true);
      try {
        await action();
      } catch (caught) {
        const error = ApiError.from(caught);
        setFailure(error);
        setErrors(fieldErrorsOf(error));
      } finally {
        sending.current = false;
        setBusy(false);
      }
    },
    [],
  );

  return { busy, errors, banner: bannerOf(errors, failure), submit };
}
