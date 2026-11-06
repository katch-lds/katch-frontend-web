import { screen } from '@testing-library/react';
import { companyStatus, loginResponse } from '../../test/fixtures';
import { renderApp, signedInStore } from '../../test/renderApp';
import { companyService, resetServiceMocks } from '../../test/servicesMock';
import { ApiError } from '../api/ApiError';
import { SessionStore } from '../session/SessionStore';
import type { CompanyStatus } from '../types/api';
import { homePath, loginPathFor, loginPathForArea } from './paths';

jest.mock('../services', () => jest.requireActual('../../test/servicesMock'));

const location = () => screen.getByTestId('location').textContent;

function withCompany(status: CompanyStatus | null) {
  companyService.getStatus.mockResolvedValue(status === null ? null : companyStatus({ status }));
}

beforeEach(() => resetServiceMocks());

describe('RequireSession', () => {
  it.each([
    ['/matches', '/entrar'],
    ['/conversas', '/entrar'],
    ['/vagas', '/entrar'],
    ['/empresa/estado', '/entrar'],
    ['/acesso-negado', '/entrar'],
    ['/admin/indicadores', '/admin/entrar'],
  ])('sem sessão, %s vai para %s', (path, login) => {
    renderApp(path);

    expect(location()).toBe(login);
  });

  it('com a credencial expirada, vai para o início de sessão', () => {
    const store = new SessionStore(null);
    store.start(
      loginResponse('RECRUITER', { expiresAt: '2000-01-01T00:00:00Z' }),
      'rui@exemplo.pt',
    );

    renderApp('/matches', store);

    expect(location()).toBe('/entrar');
  });

  it('a raiz e as rotas desconhecidas seguem a página inicial do perfil', async () => {
    withCompany('APPROVED');
    renderApp('/nao-existe', signedInStore('RECRUITER'));

    await screen.findByRole('heading', { name: 'Vagas' });
    expect(location()).toBe('/vagas');
  });

  it('a raiz sem sessão vai para o início de sessão', () => {
    renderApp('/');

    expect(location()).toBe('/entrar');
  });
});

describe('RequireUserType — Administrador nas rotas do Recrutador', () => {
  it.each(['/vagas', '/matches', '/conversas', '/empresa', '/empresa/registo', '/empresa/estado'])(
    'Administrador em %s vai para /acesso-negado',
    (path) => {
      renderApp(path, signedInStore('ADMIN'));

      expect(location()).toBe('/acesso-negado');
      expect(screen.getByRole('heading', { name: 'Acesso negado' })).toBeInTheDocument();
      expect(companyService.getStatus).not.toHaveBeenCalled();
    },
  );

  it('Recrutador em /admin/indicadores vai para /acesso-negado', async () => {
    withCompany('APPROVED');

    renderApp('/admin/indicadores', signedInStore('RECRUITER'));

    await screen.findByRole('heading', { name: 'Acesso negado' });
    expect(location()).toBe('/acesso-negado');
  });

  it('Administrador abre /admin/indicadores', () => {
    renderApp('/admin/indicadores', signedInStore('ADMIN'));

    expect(screen.getByRole('heading', { name: 'Indicadores' })).toBeInTheDocument();
  });

  it('a página de acesso negado volta ao início do perfil', async () => {
    renderApp('/acesso-negado', signedInStore('ADMIN'));

    screen.getByRole('link', { name: 'Voltar ao início' }).click();

    await screen.findByRole('heading', { name: 'Indicadores' });
    expect(location()).toBe('/admin/indicadores');
  });
});

describe('RequireCompanyStatus', () => {
  it('/conversas com a Empresa pendente vai para /empresa/estado', async () => {
    withCompany('PENDING');

    renderApp('/conversas', signedInStore('RECRUITER'));

    await screen.findByRole('heading', { name: 'Estado do pedido da Empresa' });
    expect(location()).toBe('/empresa/estado');
  });

  it('/conversas e /matches não pedem nada ao servidor com a Empresa pendente', async () => {
    withCompany('PENDING');

    renderApp('/matches', signedInStore('RECRUITER'));

    await screen.findByRole('heading', { name: 'Estado do pedido da Empresa' });
    const { conversationService, matchService } = jest.requireMock('../services');
    expect(conversationService.list).not.toHaveBeenCalled();
    expect(matchService.list).not.toHaveBeenCalled();
  });

  it.each(['/conversas', '/matches'])(
    'Empresa suspensa continua a poder abrir %s dentro da moldura',
    async (path) => {
      withCompany('SUSPENDED');

      renderApp(path, signedInStore('RECRUITER'));

      await screen.findByRole('navigation', { name: 'Navegação do Recrutador' });
      expect(location()).toBe(path);
    },
  );

  it('Empresa suspensa não abre /vagas: vai para /empresa/estado', async () => {
    withCompany('SUSPENDED');

    renderApp('/vagas', signedInStore('RECRUITER'));

    await screen.findByRole('heading', { name: 'Estado do pedido da Empresa' });
    expect(location()).toBe('/empresa/estado');
  });

  it('sem Empresa registada, qualquer rota do Recrutador vai para /empresa/registo', async () => {
    withCompany(null);

    renderApp('/matches', signedInStore('RECRUITER'));

    await screen.findByRole('heading', { name: 'Registo da Empresa' });
    expect(location()).toBe('/empresa/registo');
  });

  it('com a Empresa aprovada, /empresa/registo e /empresa/estado vão para /vagas', async () => {
    withCompany('APPROVED');

    renderApp('/empresa/registo', signedInStore('RECRUITER'));

    await screen.findByRole('heading', { name: 'Vagas' });
    expect(location()).toBe('/vagas');
  });

  it('enquanto o estado da Empresa não está lido, mostra «A carregar…»', () => {
    companyService.getStatus.mockReturnValue(new Promise(() => undefined));

    renderApp('/matches', signedInStore('RECRUITER'));

    expect(screen.getByText('A carregar…')).toBeInTheDocument();
    expect(location()).toBe('/matches');
  });

  it('se a leitura do estado falhar, oferece «Tentar de novo»', async () => {
    companyService.getStatus
      .mockRejectedValueOnce(ApiError.connectionFailure())
      .mockResolvedValue(companyStatus({ status: 'APPROVED' }));

    renderApp('/matches', signedInStore('RECRUITER'));
    (await screen.findByRole('button', { name: 'Tentar de novo' })).click();

    expect(
      await screen.findByRole('navigation', { name: 'Navegação do Recrutador' }),
    ).toBeInTheDocument();
  });
});

describe('caminhos e página inicial', () => {
  const session = (type: 'RECRUITER' | 'ADMIN' | 'CANDIDATE') => {
    const store = new SessionStore(null);
    store.start(loginResponse(type), 'x@exemplo.pt');
    return store.get()!;
  };

  it('loginPathFor segue a área do caminho pedido', () => {
    expect(loginPathFor('/admin')).toBe('/admin/entrar');
    expect(loginPathFor('/admin/indicadores')).toBe('/admin/entrar');
    expect(loginPathFor('/administracao')).toBe('/entrar');
    expect(loginPathFor('/matches')).toBe('/entrar');
    expect(loginPathForArea('Supervision')).toBe('/admin/entrar');
    expect(loginPathForArea('Recruiter')).toBe('/entrar');
  });

  it('homePath por perfil e por estado da Empresa', () => {
    expect(homePath(session('ADMIN'), null)).toBe('/admin/indicadores');
    expect(homePath(session('RECRUITER'), null)).toBe('/empresa/registo');
    expect(homePath(session('RECRUITER'), companyStatus({ status: 'PENDING' }))).toBe(
      '/empresa/estado',
    );
    expect(homePath(session('RECRUITER'), companyStatus({ status: 'APPROVED' }))).toBe('/vagas');
    expect(homePath(session('CANDIDATE'), null)).toBe('/acesso-negado');
  });
});
