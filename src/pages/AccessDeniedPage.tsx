import { Link } from 'react-router';
import { SignOutButton } from '../components/SignOutButton';
import './auth.css';

/** A11 — destino de quem abre uma área que não é do seu perfil (por exemplo, o Recrutador na supervisão). */
export default function AccessDeniedPage() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Acesso negado</h1>
        <p>Não tem permissão para aceder a esta área.</p>
        <div className="auth-actions">
          <Link to="/">Voltar ao início</Link>
          <SignOutButton />
        </div>
      </section>
    </main>
  );
}
