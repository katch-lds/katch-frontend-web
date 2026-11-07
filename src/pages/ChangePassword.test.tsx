import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { companyStatus } from '../../test/fixtures';
import { renderApp, signedInStore } from '../../test/renderApp';
import { authService, companyService, resetServiceMocks } from '../../test/servicesMock';
import { ApiError } from '../api/ApiError';

jest.mock('../services', () => jest.requireActual('../../test/servicesMock'));

beforeEach(() => resetServiceMocks());

function fill(current: string, next: string, confirm: string) {
  fireEvent.change(screen.getByLabelText('Palavra-passe atual'), { target: { value: current } });
  fireEvent.change(screen.getByLabelText('Nova palavra-passe'), { target: { value: next } });
  fireEvent.change(screen.getByLabelText('Confirmar nova palavra-passe'), {
    target: { value: confirm },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Alterar palavra-passe' }));
}

/** O mesmo formulário serve o Recrutador (W25) e o Administrador (A10). */
const areas = [
  ['Recrutador', '/conta', 'RECRUITER'],
  ['Administrador', '/admin/conta', 'ADMIN'],
] as const;

describe.each(areas)('ChangePasswordForm — %s', (_name, path, userType) => {
  beforeEach(() =>
    companyService.getStatus.mockResolvedValue(companyStatus({ status: 'APPROVED' })),
  );

  const open = async () => {
    const store = renderApp(path, signedInStore(userType));
    await screen.findByLabelText('Palavra-passe atual');
    return store;
  };

  it('usa campos de palavra-passe com o autoComplete adequado', async () => {
    await open();

    expect(screen.getByLabelText('Palavra-passe atual')).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('Palavra-passe atual')).toHaveAttribute(
      'autocomplete',
      'current-password',
    );
    expect(screen.getByLabelText('Nova palavra-passe')).toHaveAttribute(
      'autocomplete',
      'new-password',
    );
    expect(screen.getByLabelText('Confirmar nova palavra-passe')).toHaveAttribute(
      'type',
      'password',
    );
  });

  it('com sucesso envia só a atual e a nova, limpa os campos e mostra a mensagem', async () => {
    await open();

    fill('katch2025', 'katch2026', 'katch2026');

    expect(await screen.findByRole('status')).toHaveTextContent('Palavra-passe alterada.');
    expect(authService.changePassword).toHaveBeenCalledWith({
      currentPassword: 'katch2025',
      newPassword: 'katch2026',
    });
    expect(screen.getByLabelText('Palavra-passe atual')).toHaveValue('');
    expect(screen.getByLabelText('Nova palavra-passe')).toHaveValue('');
    expect(screen.getByLabelText('Confirmar nova palavra-passe')).toHaveValue('');
  });

  it('valida antes de enviar: política e confirmação', async () => {
    await open();

    fill('katch2025', 'katch', 'outra');

    expect(authService.changePassword).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Nova palavra-passe')).toHaveAccessibleDescription(
      /entre 8 e 128 caracteres/,
    );
    expect(screen.getByLabelText('Confirmar nova palavra-passe')).toHaveAccessibleDescription(
      'A confirmação não coincide com a nova palavra-passe.',
    );
    expect(screen.getByLabelText('Nova palavra-passe')).toHaveFocus();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('ERR-10: mostra o motivo do servidor junto do campo e não limpa os campos', async () => {
    authService.changePassword.mockRejectedValue(
      new ApiError(400, 'Dados inválidos.', 'ERR-10', [
        { field: 'currentPassword', reason: 'A palavra-passe atual está errada.' },
      ]),
    );
    await open();

    fill('errada123', 'katch2026', 'katch2026');

    expect(await screen.findByText('A palavra-passe atual está errada.')).toBeInTheDocument();
    expect(screen.getByLabelText('Palavra-passe atual')).toHaveAccessibleDescription(
      'A palavra-passe atual está errada.',
    );
    expect(screen.getByLabelText('Palavra-passe atual')).toHaveFocus();
    expect(screen.getByLabelText('Nova palavra-passe')).toHaveValue('katch2026');
  });

  it('falha de ligação: mostra o aviso e «Tentar de novo» volta a enviar', async () => {
    authService.changePassword
      .mockRejectedValueOnce(ApiError.connectionFailure())
      .mockResolvedValueOnce(undefined);
    await open();

    fill('katch2025', 'katch2026', 'katch2026');

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível contactar');
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Palavra-passe alterada.');
    expect(authService.changePassword).toHaveBeenCalledTimes(2);
  });
});

describe('AccountPage', () => {
  it('mostra o e-mail da sessão e «Terminar sessão» (RF106), sem Empresa registada', async () => {
    companyService.getStatus.mockResolvedValue(null);
    const store = renderApp('/conta', signedInStore('RECRUITER'));

    const heading = await screen.findByRole('heading', { name: 'Conta' });
    expect(screen.getByText('utilizador@exemplo.pt')).toBeInTheDocument();
    const page = heading.closest('section') as HTMLElement;
    fireEvent.click(within(page).getByRole('button', { name: 'Terminar sessão' }));

    expect(await screen.findByRole('heading', { name: 'Início de sessão' })).toBeInTheDocument();
    expect(store.get()).toBeNull();
    expect(screen.getByTestId('location')).toHaveTextContent('/entrar');
  });

  it('o Recrutador não tem «Cancelar» no formulário da conta', async () => {
    companyService.getStatus.mockResolvedValue(companyStatus({ status: 'APPROVED' }));
    renderApp('/conta', signedInStore('RECRUITER'));
    await screen.findByLabelText('Palavra-passe atual');

    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument();
  });
});

describe('ChangePasswordPage', () => {
  it('«Cancelar» volta a /admin/indicadores', async () => {
    renderApp('/admin/conta', signedInStore('ADMIN'));
    await screen.findByLabelText('Palavra-passe atual');

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('/admin/indicadores'),
    );
  });
});
