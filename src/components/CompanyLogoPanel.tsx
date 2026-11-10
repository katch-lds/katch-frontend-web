import { useFileUpload } from '../hooks/useFileUpload';
import { LOGO_MAX_MB } from '../validation/company';
import { ImageUploadButton } from './ImageUploadButton';
import { ProtectedImage } from './ProtectedImage';

// I121 — logótipo da Empresa (W07, RF047).

interface CompanyLogoPanelProps {
  logoUrl: string | null;
  onUpload: (file: File) => Promise<void>;
}

export function CompanyLogoPanel({ logoUrl, onUpload }: Readonly<CompanyLogoPanelProps>) {
  const { busy, error, upload } = useFileUpload(LOGO_MAX_MB, onUpload);
  return (
    <section className="photos-box" aria-labelledby="company-logo-title">
      <h2 id="company-logo-title">Logótipo</h2>
      <ProtectedImage url={logoUrl} alt="Logótipo da Empresa" />
      <p className="note">JPEG ou PNG até {LOGO_MAX_MB} MB</p>
      <ImageUploadButton
        label="Escolher"
        busy={busy}
        error={error}
        onSelect={(file) => void upload(file)}
      />
    </section>
  );
}
