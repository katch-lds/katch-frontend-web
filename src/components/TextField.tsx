import { FormField } from './FormField';

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
  /** Campo só de leitura (NIF da Empresa aprovada). */
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
