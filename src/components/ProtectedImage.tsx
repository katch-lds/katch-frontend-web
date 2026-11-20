import { useProtectedFile } from '../hooks/useProtectedFile';

// Sem ficheiro, ou com 404, mostra o marcador vazio do protótipo.

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
