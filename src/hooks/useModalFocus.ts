import { type KeyboardEvent, type RefObject, useEffect } from 'react';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Foco de um diálogo modal.
 *
 * Ao abrir, o foco vai para `initialFocus`; enquanto o diálogo está aberto, Tab e Shift+Tab ficam dentro dele e
 * Escape fecha-o; ao fechar, o foco volta ao elemento que o tinha antes (por exemplo, o botão que abriu o diálogo).
 *
 * @param initialFocus Elemento que recebe o foco ao abrir.
 * @param onClose Fecha o diálogo, com Escape.
 * @param closable Falso enquanto o diálogo não pode ser fechado (por exemplo, durante o pedido).
 * @returns O tratamento de teclas a pôr no `onKeyDown` do elemento com `role="dialog"`.
 */
export function useModalFocus(
  initialFocus: RefObject<HTMLElement | null>,
  onClose: () => void,
  closable: boolean,
): (event: KeyboardEvent<HTMLElement>) => void {
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    initialFocus.current?.focus();
    return () => previous?.focus();
  }, [initialFocus]);

  return (event) => {
    if (event.key === 'Escape') {
      if (closable) {
        onClose();
      }
      return;
    }
    if (event.key !== 'Tab') {
      return;
    }
    const focusable = event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
}
