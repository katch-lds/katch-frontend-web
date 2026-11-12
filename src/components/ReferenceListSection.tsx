import { useState } from 'react';
import { useFormSubmission } from '../hooks/useFormSubmission';
import type { ReferenceItemDto } from '../types/api';
import { referenceNameError } from '../validation/admin';
import { FormBanner } from './FormBanner';
import { SubmitButton } from './SubmitButton';
import { TextField } from './TextField';

// I073 — uma das listas pré-definidas editáveis (A09 e A09b): alterar a designação na própria lista e acrescentar.
// A designação vazia é rejeitada aqui; a repetida, com o motivo do servidor (ERR-10), junto do campo.

interface ReferenceListSectionProps {
  /** Identificador único da secção (ids dos campos). */
  listKey: string;
  title: string;
  /** Rótulo do campo de acrescento, por exemplo «Nova competência». */
  addLabel: string;
  items: ReferenceItemDto[];
  emptyMessage: string;
  onAdd: (name: string) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
}

function RenameForm({
  item,
  onRename,
  onDone,
}: Readonly<{
  item: ReferenceItemDto;
  onRename: (id: string, name: string) => Promise<void>;
  onDone: () => void;
}>) {
  const [name, setName] = useState(item.name);
  const { busy, errors, banner, submit } = useFormSubmission();
  return (
    <form
      className="reference-form"
      noValidate
      aria-label={`Alterar designação de ${item.name}`}
      onSubmit={(event) => {
        const error = referenceNameError(name);
        void submit(event, error ? { name: error } : {}, async () => {
          await onRename(item.id, name.trim());
          onDone();
        });
      }}
    >
      <FormBanner banner={banner} busy={busy} />
      <TextField
        id={`rename-${item.id}`}
        label={`Nova designação de ${item.name}`}
        value={name}
        onChange={setName}
        error={errors.name}
      />
      <SubmitButton busy={busy}>Guardar</SubmitButton>
      <button type="button" disabled={busy} onClick={onDone}>
        Cancelar
      </button>
    </form>
  );
}

function AddForm({
  listKey,
  label,
  onAdd,
}: Readonly<{ listKey: string; label: string; onAdd: (name: string) => Promise<void> }>) {
  const [name, setName] = useState('');
  const { busy, errors, banner, submit } = useFormSubmission();
  return (
    <form
      className="reference-form"
      noValidate
      aria-label={`Acrescentar ${label.toLowerCase()}`}
      onSubmit={(event) => {
        const error = referenceNameError(name);
        void submit(event, error ? { name: error } : {}, async () => {
          await onAdd(name.trim());
          setName('');
        });
      }}
    >
      <FormBanner banner={banner} busy={busy} />
      <TextField
        id={`add-${listKey}`}
        label={label}
        value={name}
        onChange={setName}
        error={errors.name}
      />
      <SubmitButton busy={busy}>Acrescentar</SubmitButton>
    </form>
  );
}

export function ReferenceListSection({
  listKey,
  title,
  addLabel,
  items,
  emptyMessage,
  onAdd,
  onRename,
}: Readonly<ReferenceListSectionProps>) {
  const [editingId, setEditingId] = useState<string | null>(null);
  return (
    <section className="reference-list" aria-labelledby={`title-${listKey}`}>
      <h2 id={`title-${listKey}`}>{title}</h2>
      {items.length === 0 && <p className="empty-state">{emptyMessage}</p>}
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {editingId === item.id ? (
              <RenameForm item={item} onRename={onRename} onDone={() => setEditingId(null)} />
            ) : (
              <>
                <span>{item.name}</span>
                <button
                  type="button"
                  aria-label={`Alterar designação de ${item.name}`}
                  onClick={() => setEditingId(item.id)}
                >
                  Alterar designação
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      <AddForm listKey={listKey} label={addLabel} onAdd={onAdd} />
    </section>
  );
}
