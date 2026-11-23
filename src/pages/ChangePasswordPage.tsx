import { useNavigate } from 'react-router';
import { ChangePasswordForm } from '../components/ChangePasswordForm';
import { paths } from '../routes/paths';
import './auth.css';
import './recruiter.css';

/** A10 — alteração da palavra-passe do Administrador (RF084); «Cancelar» volta aos indicadores. */
export default function ChangePasswordPage() {
  const navigate = useNavigate();
  return (
    <section className="recruiter-page account">
      <h1>Alterar palavra-passe</h1>
      <ChangePasswordForm onCancel={() => void navigate(paths.adminIndicators)} />
    </section>
  );
}
