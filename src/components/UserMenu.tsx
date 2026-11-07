import { useEffect, useRef, useState } from 'react';

// I069 — UserMenu (modelo de classes do frontend web v02, secção 8.1; ecrã A02b; RF084, RF107).

interface UserMenuProps {
  displayName: string;
  email: string;
  onChangePassword: () => void;
  onSignOut: () => void;
}

/** Menu do utilizador da barra superior: fecha ao clicar fora e com Escape. */
export function UserMenu({
  displayName,
  email,
  onChangePassword,
  onSignOut,
}: Readonly<UserMenuProps>) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);

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
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {displayName}
      </button>
      {open && (
        <div className="user-menu-panel" role="menu">
          <p className="user-menu-email">{email}</p>
          <button type="button" role="menuitem" onClick={choose(onChangePassword)}>
            Alterar palavra-passe
          </button>
          <button type="button" role="menuitem" onClick={choose(onSignOut)}>
            Terminar sessão
          </button>
        </div>
      )}
    </div>
  );
}
