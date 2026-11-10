import { useProtectedFile } from '../hooks/useProtectedFile';

// I070 — ProtectedImage (modelo de classes do frontend web v02, secção 8.1): sem ficheiro, ou com 404, mostra o
// marcador vazio do protótipo.

export function ProtectedImage({ url, alt }: Readonly<{ url: string | null; alt: string }>) {
  const source = useProtectedFile(url);
  if (source === null) {
    return (
      <span className="photo-placeholder" role="img" aria-label={alt}>
        Fotografia
      </span>
    );
  }
  return <img className="photo" src={source} alt={alt} />;
}
