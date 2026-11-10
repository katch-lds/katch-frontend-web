import type { ReactNode } from 'react';

// I069 — campo de formulário com etiqueta e erro por campo (modelo de classes do frontend web v02, secção 8.1).

/** Atributos que o controlo (input, select) recebe para ficar ligado à etiqueta e ao erro. */
export interface FieldControlProps {
  id: string;
  'aria-invalid': true | undefined;
  'aria-describedby': string | undefined;
}

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  children: (control: FieldControlProps) => ReactNode;
}

/** Etiqueta ligada ao controlo e motivo do erro ligado com `aria-describedby`. */
export function FormField({ id, label, error, children }: Readonly<FormFieldProps>) {
  const errorId = `${id}-error`;
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error ? errorId : undefined,
      })}
      {error && (
        <p id={errorId} className="form-error">
          {error}
        </p>
      )}
    </div>
  );
}
