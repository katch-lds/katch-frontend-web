import { useEffect, useId, useRef, useState } from 'react';

interface UserMenuProps {
  displayName: string;
  email: string;
  onChangePassword: () => void;
  onSignOut: () => void;
}

/**
 * Menu do utilizador da barra superior da supervisão (A02b; RF084, RF107): um botão que mostra um painel com o
 * e-mail e duas ações. Fecha ao clicar fora e com Escape, que devolve o foco ao botão.
 */
export function UserMenu({
  displayName,
  email,
  onChangePassword,
  onSignOut,
}: Readonly<UserMenuProps>) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const closeOutside = (event: MouseEvent) => {
      if (!container.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    document.addEventListener('mousedown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const choose = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  return (
    <div className="user-menu" ref={container}>
      <button
        ref={toggle}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
      >
        {displayName}
      </button>
      {open && (
        <div className="user-menu-panel" id={panelId}>
          <p className="user-menu-email">{email}</p>
          <button type="button" onClick={choose(onChangePassword)}>
            Alterar palavra-passe
          </button>
          <button type="button" onClick={choose(onSignOut)}>
            Terminar sessão
          </button>
        </div>
      )}
    </div>
  );
}
