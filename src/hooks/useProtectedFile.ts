import { useEffect, useState } from 'react';
import { apiClient } from '../api';

// I070 — useProtectedFile (modelo de classes do frontend web v02, secção 4.3): os ficheiros são servidos com a
// credencial de sessão no cabeçalho, por isso não podem ir diretamente para o atributo src de uma imagem.

interface Loaded {
  url: string;
  objectUrl: string | null;
}

/** Obtém o ficheiro do endereço devolvido pela API e devolve um endereço local, revogado ao desmontar. */
export function useProtectedFile(url: string | null): string | null {
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (url === null) {
      return undefined;
    }
    let current = true;
    let created: string | null = null;
    apiClient.getFile(url).then(
      (blob) => {
        if (current) {
          created = URL.createObjectURL(blob);
          setLoaded({ url, objectUrl: created });
        }
      },
      () => current && setLoaded({ url, objectUrl: null }),
    );
    return () => {
      current = false;
      if (created !== null) {
        URL.revokeObjectURL(created);
      }
    };
  }, [url]);

  return loaded !== null && loaded.url === url ? loaded.objectUrl : null;
}
