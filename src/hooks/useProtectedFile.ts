import { useEffect, useState } from 'react';
import { apiClient } from '../api';

interface Loaded {
  url: string;
  objectUrl: string | null;
}

/**
 * Ficheiro protegido como endereço local (modelo de classes do frontend web v02, secção 4.3).
 *
 * Os ficheiros são servidos com a credencial de sessão no cabeçalho, por isso não podem ir diretamente para o
 * atributo `src` de uma imagem. O endereço local é revogado ao desmontar.
 *
 * @param url Endereço devolvido pela API; null sem ficheiro.
 * @returns O endereço local, ou null enquanto carrega, sem ficheiro ou em erro.
 */
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
      () => {
        if (current) {
          setLoaded({ url, objectUrl: null });
        }
      },
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
