import { fireEvent, screen } from '@testing-library/react';
import { loginResponse } from '../../test/fixtures';
import { renderApp } from '../../test/renderApp';
import { authService, companyService, resetServiceMocks } from '../../test/servicesMock';
import { ApiError } from '../api/ApiError';

jest.mock('../services', () => jest.requireActual('../../test/servicesMock'));

function fill(email: string, password: string, acceptTerms: boolean) {
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Palavra-passe'), { target: { value: password } });
  if (acceptTerms) {
    fireEvent.click(screen.getByLabelText('Aceito as condições de utilização'));
  }
  fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
}

beforeEach(() => resetServiceMocks());

describe('CreateRecruiterAccountPage', () => {
  it('W02: usa autoComplete new-password e liga «Já tenho conta» ao início de sessão', () => {
    renderApp('/criar-conta');

    expect(screen.getByLabelText('Palavra-passe')).toHaveAttribute('autocomplete', 'new-password');
    expect(screen.getByRole('link', { name: 'Já tenho conta' })).toHaveAttribute('href', '/entrar');
  });

  it('assinala cada campo inválido, não envia e põe o foco no primeiro', () => {
    renderApp('/criar-conta');

    fill('ana', 'curta', false);

    expect(authService.createRecruiterAccount).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Corrija os campos indicados');
    expect(screen.getByText('O e-mail não tem um formato válido.')).toBeInTheDocument();
    expect(screen.getByText(/A palavra-passe deve ter entre 8 e 128/)).toBeInTheDocument();
    expect(screen.getByText('Tem de aceitar as condições de utilização.')).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toHaveFocus();
  });

  it('exige uma letra e um algarismo na palavra-passe', () => {
    renderApp('/criar-conta');

    fill('ana@exemplo.pt', 'somenteletras', true);

    expect(screen.getByText(/pelo menos uma letra e um algarismo/)).toBeInTheDocument();
  });

  it('mostra o motivo do servidor junto do campo (ERR-10)', async () => {
    authService.createRecruiterAccount.mockRejectedValue(
      new ApiError(400, 'Dados inválidos.', 'ERR-10', [
        { field: 'password', reason: 'A palavra-passe é demasiado comum.' },
      ]),
    );
    renderApp('/criar-conta');

    fill('ana@exemplo.pt', 'Segredo123', true);

    expect(await screen.findByText('A palavra-passe é demasiado comum.')).toBeInTheDocument();
    expect(screen.getByLabelText('Palavra-passe')).toHaveFocus();
  });

  it('mostra a mensagem do servidor quando o e-mail já existe', async () => {
    authService.createRecruiterAccount.mockRejectedValue(
      new ApiError(409, 'Já existe uma conta com este e-mail.', 'ERR-41'),
    );
    renderApp('/criar-conta');

    fill('ana@exemplo.pt', 'Segredo123', true);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Já existe uma conta com este e-mail.',
    );
  });

  it('com a conta criada a sessão fica iniciada e segue-se o registo da Empresa', async () => {
    authService.createRecruiterAccount.mockResolvedValue(loginResponse('RECRUITER'));
    companyService.getStatus.mockResolvedValue(null);
    const store = renderApp('/criar-conta');

    fill(' ana@exemplo.pt ', 'Segredo123', true);

    await screen.findByRole('heading', { name: 'Registo da Empresa' });
    expect(screen.getByTestId('location')).toHaveTextContent('/empresa/registo');
    expect(authService.createRecruiterAccount).toHaveBeenCalledWith({
      email: 'ana@exemplo.pt',
      password: 'Segredo123',
      acceptTerms: true,
    });
    expect(store.get()?.email).toBe('ana@exemplo.pt');
  });
});
