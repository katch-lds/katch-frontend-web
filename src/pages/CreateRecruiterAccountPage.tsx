import { type FormEvent, useState } from 'react';
import { Link } from 'react-router';
import { FormBanner } from '../components/FormBanner';
import { FormField } from '../components/FormField';
import { SubmitButton } from '../components/SubmitButton';
import { TextField } from '../components/TextField';
import { useFormSubmission } from '../hooks/useFormSubmission';
import { useSession } from '../hooks/useSession';
import { paths } from '../routes/paths';
import { validateAccount } from '../validation/forms';
import './auth.css';

// I069 — CreateRecruiterAccountPage (modelo de classes do frontend web v02, secção 8; ecrã W02 do protótipo v02).

/** Criação de conta de Recrutador; com a conta criada a sessão fica iniciada e segue-se o registo da Empresa. */
export default function CreateRecruiterAccountPage() {
  const { signUp } = useSession();
  const form = useFormSubmission();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    void form.submit(event, validateAccount({ email, password, acceptTerms }), () =>
      signUp({ email: email.trim(), password, acceptTerms }),
    );
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <h1>Criar conta</h1>
        <p className="auth-subtitle">Backoffice do Recrutador</p>
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
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          error={form.errors.password}
        />
        <p className="auth-note">Pelo menos 8 caracteres, com uma letra e um algarismo.</p>
        <FormField
          id="acceptTerms"
          label="Aceito as condições de utilização"
          error={form.errors.acceptTerms}
        >
          {(control) => (
            <input
              {...control}
              type="checkbox"
              checked={acceptTerms}
              onChange={(event) => setAcceptTerms(event.target.checked)}
            />
          )}
        </FormField>
        <SubmitButton busy={form.busy}>Criar conta</SubmitButton>
        <p className="auth-links">
          <Link to={paths.login}>Já tenho conta</Link>
        </p>
      </form>
    </main>
  );
}
