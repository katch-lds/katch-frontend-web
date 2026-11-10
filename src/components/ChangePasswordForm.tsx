import { type FormEvent, useState } from 'react';
import { useFormSubmission } from '../hooks/useFormSubmission';
import { authService } from '../services';
import { validateChangePassword } from '../validation/forms';
import { FormBanner } from './FormBanner';
import { SubmitButton } from './SubmitButton';
import { TextField } from './TextField';

// I069 — ChangePasswordForm (modelo de classes do frontend web v02, secção 8.1; ecrãs W25, A10 e A10b; RF040, RF084).

interface ChangePasswordFormProps {
  /** Quando existe, mostra «Cancelar» (área de supervisão). */
  onCancel?: () => void;
}

/**
 * Alteração da própria palavra-passe, comum ao Recrutador e ao Administrador. As palavras-passe só existem neste
 * formulário e são limpas depois do sucesso; a confirmação nunca vai para a API.
 */
export function ChangePasswordForm({ onCancel }: Readonly<ChangePasswordFormProps>) {
  const form = useFormSubmission();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changed, setChanged] = useState(false);

  const change = async () => {
    await authService.changePassword({ currentPassword, newPassword });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setChanged(true);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    setChanged(false);
    const errors = validateChangePassword({ currentPassword, newPassword, confirmPassword });
    void form.submit(event, errors, change);
  };

  return (
    <form className="stack" onSubmit={handleSubmit} noValidate>
      <FormBanner banner={form.banner} busy={form.busy} />
      <TextField
        id="currentPassword"
        label="Palavra-passe atual"
        type="password"
        autoComplete="current-password"
        value={currentPassword}
        onChange={setCurrentPassword}
        error={form.errors.currentPassword}
      />
      <TextField
        id="newPassword"
        label="Nova palavra-passe"
        type="password"
        autoComplete="new-password"
        value={newPassword}
        onChange={setNewPassword}
        error={form.errors.newPassword}
      />
      <TextField
        id="confirmPassword"
        label="Confirmar nova palavra-passe"
        type="password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        error={form.errors.confirmPassword}
      />
      {changed && (
        <p role="status" className="form-notice">
          Palavra-passe alterada.
        </p>
      )}
      <div className="auth-actions">
        <SubmitButton busy={form.busy}>Alterar palavra-passe</SubmitButton>
        {onCancel && (
          <button type="button" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
