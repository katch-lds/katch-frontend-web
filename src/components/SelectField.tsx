import { FormField } from './FormField';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder: string;
  error?: string;
  disabled?: boolean;
}

export function SelectField({
  id,
  label,
  value,
  options,
  onChange,
  placeholder,
  error,
  disabled = false,
}: Readonly<SelectFieldProps>) {
  return (
    <FormField id={id} label={label} error={error}>
      {(control) => (
        <select
          {...control}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FormField>
  );
}
