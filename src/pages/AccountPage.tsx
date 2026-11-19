import { ChangePasswordForm } from '../components/ChangePasswordForm';
import { SignOutButton } from '../components/SignOutButton';
import { useSession } from '../hooks/useSession';
import './auth.css';
import './recruiter.css';

/**
 * W25 — conta do Recrutador: correio da sessão, alteração da palavra-passe e fim de sessão, com a Empresa em
 * qualquer estado (RF040, RF106).
 */
export default function AccountPage() {
  const { session } = useSession();
  return (
    <section className="recruiter-page account">
      <h1>Conta</h1>
      <p>
        E-mail: <strong>{session?.email}</strong>
      </p>
      <h2>Alterar palavra-passe</h2>
      <ChangePasswordForm />
      <div className="auth-actions">
        <SignOutButton />
      </div>
    </section>
  );
}
