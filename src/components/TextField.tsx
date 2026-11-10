import { FormField } from './FormField';

// I069 — campo de texto com etiqueta e erro por campo (modelo de classes do frontend web v02, secção 8.1).

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: 'text' | 'email' | 'password';
  autoComplete?: string;
  inputMode?: 'text' | 'numeric' | 'decimal' | 'tel';
  placeholder?: string;
  /** I121 — campo só de leitura (NIF da Empresa aprovada). */
  readOnly?: boolean;
}

export function TextField({
  id,
  label,
  value,
  onChange,
  error,
  type = 'text',
  autoComplete,
  inputMode,
  placeholder,
  readOnly,
}: Readonly<TextFieldProps>) {
  return (
    <FormField id={id} label={label} error={error}>
      {(control) => (
        <input
          {...control}
          type={type}
          value={value}
          autoComplete={autoComplete}
          inputMode={inputMode}
          placeholder={placeholder}
          readOnly={readOnly}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </FormField>
  );
}
