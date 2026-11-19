import { useCallback, useRef, useState } from 'react';
import { ApiError } from '../api/ApiError';
import { validateImageFile } from '../validation/company';

export interface FileUpload {
  busy: boolean;
  error: string | null;
  upload: (file: File) => Promise<void>;
}

/**
 * Carregamento de uma imagem.
 *
 * Valida no cliente (sem pedido se falhar), faz um só envio de cada vez e mostra a mensagem do servidor quando recusa
 * o ficheiro (ERR-11, ERR-12, ERR-13, ERR-39).
 *
 * @param maxMb Dimensão máxima do ficheiro, em MB (inclusiva).
 * @param send Envia o ficheiro ao servidor.
 * @param precheck Devolve o motivo que impede qualquer envio (por exemplo, a galeria cheia) ou null.
 * @returns O estado do envio, o último erro e `upload`.
 */
export function useFileUpload(
  maxMb: number,
  send: (file: File) => Promise<void>,
  precheck?: () => string | null,
): FileUpload {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sending = useRef(false);

  const upload = useCallback(
    async (file: File) => {
      if (sending.current) {
        return;
      }
      const reason = precheck?.() ?? validateImageFile(file, maxMb);
      setError(reason);
      if (reason !== null) {
        return;
      }
      sending.current = true;
      setBusy(true);
      try {
        await send(file);
      } catch (caught) {
        setError(ApiError.from(caught).message);
      } finally {
        sending.current = false;
        setBusy(false);
      }
    },
    [maxMb, send, precheck],
  );

  return { busy, error, upload };
}
