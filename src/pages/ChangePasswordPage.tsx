import { useNavigate } from 'react-router';
import { ChangePasswordForm } from '../components/ChangePasswordForm';
import { paths } from '../routes/paths';
import './auth.css';
import './recruiter.css';

// I069 — ChangePasswordPage (modelo de classes do frontend web v02, secção 8.3; ecrãs A10 e A10b; RF084).

/** Alteração da palavra-passe do Administrador; «Cancelar» volta aos indicadores. */
export default function ChangePasswordPage() {
  const navigate = useNavigate();
  return (
    <section className="recruiter-page account">
      <h1>Alterar palavra-passe</h1>
      <ChangePasswordForm onCancel={() => void navigate(paths.adminIndicators)} />
    </section>
  );
}
