import type { ReferenceItemDto } from '../types/api';

// I070 — escolha múltipla de uma lista pré-definida (competências e benefícios da vaga; RF050).

interface ChoiceListProps {
  id: string;
  legend: string;
  items: ReferenceItemDto[];
  selected: string[];
  onChange: (selected: string[]) => void;
  error?: string;
}

export function ChoiceList({
  id,
  legend,
  items,
  selected,
  onChange,
  error,
}: Readonly<ChoiceListProps>) {
  const errorId = `${id}-error`;
  const toggle = (itemId: string, checked: boolean) =>
    onChange(checked ? [...selected, itemId] : selected.filter((value) => value !== itemId));

  return (
    <fieldset
      id={id}
      className="choice-list"
      tabIndex={-1}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : undefined}
    >
      <legend>{legend}</legend>
      {items.length === 0 && <p className="note">A lista está vazia.</p>}
      <div className="choices">
        {items.map((item) => (
          <label key={item.id} className="choice">
            <input
              type="checkbox"
              checked={selected.includes(item.id)}
              onChange={(event) => toggle(item.id, event.target.checked)}
            />
            {item.name}
          </label>
        ))}
      </div>
      {error && (
        <p id={errorId} className="form-error">
          {error}
        </p>
      )}
    </fieldset>
  );
}
