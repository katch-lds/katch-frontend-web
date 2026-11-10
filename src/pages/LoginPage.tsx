import { type FormEvent, useState } from 'react';
import { Link } from 'react-router';
import { FormBanner } from '../components/FormBanner';
import { SubmitButton } from '../components/SubmitButton';
import { TextField } from '../components/TextField';
import { useFormSubmission } from '../hooks/useFormSubmission';
import { useSession } from '../hooks/useSession';
import { paths } from '../routes/paths';
import type { LoginArea } from '../types/LoginArea';
import { validateLogin } from '../validation/forms';
import './auth.css';

// I069 — LoginPage (modelo de classes do frontend web v02, secção 8; ecrãs W01, A01 e A01b do protótipo v02).

/**
 * Início de sessão numa só página, em duas rotas: `/entrar` (Recrutador, com «Criar conta») e `/admin/entrar`
 * (supervisão). Depois de iniciada a sessão, o `PublicOnly` encaminha para a página inicial do perfil.
 */
export default function LoginPage({ area }: Readonly<{ area: LoginArea }>) {
  const { signIn } = useSession();
  const form = useFormSubmission();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const supervision = area === 'Supervision';

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    void form.submit(event, validateLogin({ email, password }), () =>
      signIn({ email: email.trim(), password }),
    );
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <h1>Início de sessão</h1>
        <p className="auth-subtitle">
          {supervision ? 'Recrutadores e Administrador' : 'Backoffice do Recrutador'}
        </p>
        <FormBanner banner={form.banner} busy={form.busy} />
        <TextField
          id="email"
          label="E-mail"
          type="email"
          autoComplete="username"
          value={email}
          onChange={setEmail}
          error={form.errors.email}
        />
        <TextField
          id="password"
          label="Palavra-passe"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          error={form.errors.password}
        />
        <SubmitButton busy={form.busy}>Entrar</SubmitButton>
        {supervision ? (
          <p className="auth-note">Os Candidatos utilizam a aplicação móvel</p>
        ) : (
          <p className="auth-links">
            <Link to={paths.createAccount}>Criar conta</Link>
          </p>
        )}
      </form>
    </main>
  );
}
