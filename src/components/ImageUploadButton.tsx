import type { ChangeEvent } from 'react';

// I121 — escolha de uma imagem (FileUpload do modelo de classes, secção 8.1): botão, estado de envio e erro junto do campo.

interface ImageUploadButtonProps {
  label: string;
  busy: boolean;
  disabled?: boolean;
  error: string | null;
  onSelect: (file: File) => void;
}

export function ImageUploadButton({
  label,
  busy,
  disabled = false,
  error,
  onSelect,
}: Readonly<ImageUploadButtonProps>) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file !== undefined) {
      onSelect(file);
    }
    // Permite escolher de novo o mesmo ficheiro depois de uma recusa.
    event.target.value = '';
  };
  return (
    <>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <label className="file-button">
        {label}
        <input
          type="file"
          accept="image/jpeg,image/png"
          disabled={disabled || busy}
          aria-invalid={error ? true : undefined}
          onChange={handleChange}
        />
      </label>
      {busy && <p role="status">A enviar…</p>}
    </>
  );
}
