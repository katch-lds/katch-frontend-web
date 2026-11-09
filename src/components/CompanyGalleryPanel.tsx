import { useCallback } from 'react';
import { useFileUpload } from '../hooks/useFileUpload';
import { GALLERY_MAX_MB, GALLERY_MAX_PHOTOS } from '../validation/company';
import { ImageUploadButton } from './ImageUploadButton';
import { ProtectedImage } from './ProtectedImage';

// I121 — galeria de fotografias da Empresa (W07, RF048): no máximo 6.

interface CompanyGalleryPanelProps {
  photoUrls: string[];
  onUpload: (file: File) => Promise<void>;
}

export function CompanyGalleryPanel({ photoUrls, onUpload }: Readonly<CompanyGalleryPanelProps>) {
  const full = photoUrls.length >= GALLERY_MAX_PHOTOS;
  const precheck = useCallback(
    () => (full ? `A galeria já tem ${GALLERY_MAX_PHOTOS} fotografias.` : null),
    [full],
  );
  const { busy, error, upload } = useFileUpload(GALLERY_MAX_MB, onUpload, precheck);
  return (
    <section className="photos-box" aria-labelledby="company-gallery-title">
      <h2 id="company-gallery-title">Galeria</h2>
      <p className="note">{`${photoUrls.length}/${GALLERY_MAX_PHOTOS}`}</p>
      <p className="note">
        Até {GALLERY_MAX_PHOTOS} fotografias, JPEG ou PNG até {GALLERY_MAX_MB} MB cada
      </p>
      <ul className="photo-grid">
        {photoUrls.map((url, index) => (
          <li key={url}>
            <ProtectedImage url={url} alt={`Fotografia ${index + 1} da galeria`} />
          </li>
        ))}
      </ul>
      <ImageUploadButton
        label="Adicionar fotografia"
        busy={busy}
        disabled={full}
        error={error}
        onSelect={(file) => void upload(file)}
      />
    </section>
  );
}
