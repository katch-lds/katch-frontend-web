import { fireEvent, screen, waitFor } from '@testing-library/react';
import { companyStatus, loginResponse } from '../../test/fixtures';
import { renderApp, signedInStore } from '../../test/renderApp';
import { authService, companyService, resetServiceMocks } from '../../test/servicesMock';
import { ApiError } from '../api/ApiError';

jest.mock('../services', () => jest.requireActual('../../test/servicesMock'));

function signInWith(email = 'rui@exemplo.pt', password = 'Segredo123') {
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Palavra-passe'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
}

const location = () => screen.getByTestId('location').textContent;

beforeEach(() => resetServiceMocks());

describe('LoginPage — apresentação', () => {
  it('W01: mostra o título, o subtítulo do Recrutador e «Criar conta»', () => {
    renderApp('/entrar');

    expect(screen.getByRole('heading', { name: 'Início de sessão' })).toBeInTheDocument();
    expect(screen.getByText('Backoffice do Recrutador')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Criar conta' })).toHaveAttribute(
      'href',
      '/criar-conta',
    );
    expect(screen.queryByText('Os Candidatos utilizam a aplicação móvel')).not.toBeInTheDocument();
  });

  it('A01: mostra o subtítulo da supervisão e a nota para os Candidatos, sem «Criar conta»', () => {
    renderApp('/admin/entrar');

    expect(screen.getByText('Recrutadores e Administrador')).toBeInTheDocument();
    expect(screen.getByText('Os Candidatos utilizam a aplicação móvel')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Criar conta' })).not.toBeInTheDocument();
  });

  it('usa os tipos e os autoComplete adequados nos campos', () => {
    renderApp('/entrar');

    expect(screen.getByLabelText('E-mail')).toHaveAttribute('autocomplete', 'username');
    expect(screen.getByLabelText('Palavra-passe')).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('Palavra-passe')).toHaveAttribute(
      'autocomplete',
      'current-password',
    );
  });
});

describe('LoginPage — validação', () => {
  it('não envia com os campos vazios, mostra o motivo e põe o foco no primeiro campo em erro', () => {
    renderApp('/entrar');

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(authService.login).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Corrija os campos indicados');
    expect(screen.getByText('O e-mail é obrigatório.')).toBeInTheDocument();
    expect(screen.getByText('A palavra-passe é obrigatória.')).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toHaveFocus();
    expect(screen.getByLabelText('E-mail')).toHaveAccessibleDescription('O e-mail é obrigatório.');
  });

  it('no login não aplica a política da palavra-passe', async () => {
    authService.login.mockRejectedValue(new ApiError(401, 'Credenciais inválidas.', 'ERR-02'));
    renderApp('/entrar');

    signInWith('rui@exemplo.pt', 'x');

    await screen.findByText('Credenciais inválidas.');
    expect(authService.login).toHaveBeenCalledWith({ email: 'rui@exemplo.pt', password: 'x' });
  });
});

describe('LoginPage — encaminhamento por perfil e por estado da Empresa', () => {
  it('Recrutador sem Empresa registada vai para /empresa/registo', async () => {
    authService.login.mockResolvedValue(loginResponse('RECRUITER'));
    companyService.getStatus.mockResolvedValue(null);
    renderApp('/entrar');

    signInWith();

    await screen.findByRole('heading', { name: 'Registo da Empresa' });
    expect(location()).toBe('/empresa/registo');
  });

  it.each(['PENDING', 'REJECTED', 'SUSPENDED'] as const)(
    'Recrutador com a Empresa %s vai para /empresa/estado',
    async (status) => {
      authService.login.mockResolvedValue(loginResponse('RECRUITER'));
      companyService.getStatus.mockResolvedValue(companyStatus({ status }));
      renderApp('/entrar');

      signInWith();

      await screen.findByRole('heading', { name: 'Estado do pedido da Empresa' });
      expect(location()).toBe('/empresa/estado');
    },
  );

  it('Recrutador com a Empresa aprovada vai para /vagas, dentro da moldura do Recrutador', async () => {
    authService.login.mockResolvedValue(loginResponse('RECRUITER'));
    companyService.getStatus.mockResolvedValue(companyStatus({ status: 'APPROVED' }));
    renderApp('/entrar');

    signInWith();

    await screen.findByRole('heading', { name: 'Vagas' });
    expect(location()).toBe('/vagas');
    expect(screen.getByRole('navigation', { name: 'Navegação do Recrutador' })).toBeInTheDocument();
  });

  it.each(['/entrar', '/admin/entrar'])(
    'Administrador em %s vai para /admin/indicadores',
    async (path) => {
      authService.login.mockResolvedValue(loginResponse('ADMIN'));
      renderApp(path);

      signInWith('admin@exemplo.pt');

      await screen.findByRole('heading', { name: 'Painel de indicadores' });
      expect(location()).toBe('/admin/indicadores');
      expect(companyService.getStatus).not.toHaveBeenCalled();
    },
  );

  it('Recrutador em /admin/entrar vai para /acesso-negado', async () => {
    authService.login.mockResolvedValue(loginResponse('RECRUITER'));
    companyService.getStatus.mockResolvedValue(companyStatus({ status: 'APPROVED' }));
    renderApp('/admin/entrar');

    signInWith();

    await screen.findByRole('heading', { name: 'Acesso negado' });
    expect(location()).toBe('/acesso-negado');
  });

  it('quem já tem sessão e abre o início de sessão vai para a sua página inicial', async () => {
    companyService.getStatus.mockResolvedValue(companyStatus({ status: 'APPROVED' }));
    renderApp('/entrar', signedInStore('RECRUITER'));

    await screen.findByRole('heading', { name: 'Vagas' });
    expect(location()).toBe('/vagas');
  });
});

describe('LoginPage — erros do servidor', () => {
  it.each([
    [401, 'ERR-02', 'Credenciais inválidas.'],
    [403, 'ERR-03', 'A conta está bloqueada até às 10:00.'],
    [403, 'ERR-04', 'A conta está suspensa.'],
    [403, 'ERR-05', 'Esta conta não pode aceder à área web.'],
  ])(
    '%i %s: mostra a mensagem do servidor e fica no início de sessão',
    async (status, code, message) => {
      authService.login.mockRejectedValue(new ApiError(status, message, code));
      renderApp('/entrar');

      signInWith();

      expect(await screen.findByRole('alert')).toHaveTextContent(message);
      expect(location()).toBe('/entrar');
      expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled();
    },
  );

  it('ERR-10: mostra cada motivo junto do seu campo', async () => {
    authService.login.mockRejectedValue(
      new ApiError(400, 'Dados inválidos.', 'ERR-10', [
        { field: 'email', reason: 'O formato do e-mail é inválido.' },
      ]),
    );
    renderApp('/entrar');

    signInWith();

    expect(await screen.findByText('O formato do e-mail é inválido.')).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toHaveFocus();
  });

  it('sem resposta do servidor mostra a falha de ligação e «Tentar de novo» volta a enviar', async () => {
    authService.login
      .mockRejectedValueOnce(ApiError.connectionFailure())
      .mockResolvedValueOnce(loginResponse('ADMIN'));
    renderApp('/admin/entrar');

    signInWith('admin@exemplo.pt');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível contactar o servidor',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    await screen.findByRole('heading', { name: 'Painel de indicadores' });
    expect(authService.login).toHaveBeenCalledTimes(2);
  });

  it('desativa o botão durante o envio e não repete o pedido', async () => {
    let finish: (error: ApiError) => void = () => undefined;
    authService.login.mockReturnValue(new Promise((_resolve, reject) => (finish = reject)));
    renderApp('/entrar');

    signInWith();
    fireEvent.click(screen.getByRole('button', { name: 'A enviar…' }));

    expect(screen.getByRole('button', { name: 'A enviar…' })).toBeDisabled();
    expect(authService.login).toHaveBeenCalledTimes(1);
    finish(new ApiError(401, 'Credenciais inválidas.', 'ERR-02'));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled());
  });
});
