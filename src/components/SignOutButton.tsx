import { useSession } from '../hooks/useSession';

// I069 — «Terminar sessão»: descarta a credencial; a proteção de rota leva ao início de sessão da área.
export function SignOutButton() {
  const { signOut } = useSession();
  return (
    <button type="button" onClick={signOut}>
      Terminar sessão
    </button>
  );
}
