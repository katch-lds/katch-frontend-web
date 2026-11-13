import { screen } from '@testing-library/react';
import {
  candidateProfile,
  companyRegistrationDto,
  companyStatus,
  loginResponse,
} from '../../test/fixtures';
import { renderApp, signedInStore } from '../../test/renderApp';
import {
  adminCompanyService,
  candidateEvaluationService,
  companyService,
  indicatorService,
  jobService,
  resetServiceMocks,
} from '../../test/servicesMock';
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
    ['/candidatos', '/entrar'],
    ['/candidatos/match-1', '/entrar'],
    ['/candidatos/match-1/match', '/entrar'],
    ['/vagas', '/entrar'],
    ['/empresa/estado', '/entrar'],
    ['/acesso-negado', '/entrar'],
    ['/admin/indicadores', '/admin/entrar'],
    ['/admin/pendentes', '/admin/entrar'],
    ['/admin/pendentes/company-1', '/admin/entrar'],
    ['/admin/empresas', '/admin/entrar'],
    ['/admin/vagas', '/admin/entrar'],
    ['/admin/contas', '/admin/entrar'],
    ['/admin/candidatos', '/admin/entrar'],
    ['/admin/listas', '/admin/entrar'],
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
  it.each([
    '/vagas',
    '/matches',
    '/candidatos',
    '/conversas',
    '/empresa',
    '/empresa/registo',
    '/empresa/estado',
    '/conta',
  ])('Administrador em %s vai para /admin/indicadores (regra 3 da secção 7.2)', (path) => {
    renderApp(path, signedInStore('ADMIN'));

    expect(location()).toBe('/admin/indicadores');
    expect(screen.getByRole('heading', { name: 'Painel de indicadores' })).toBeInTheDocument();
    expect(companyService.getStatus).not.toHaveBeenCalled();
  });

  it.each([
    '/admin/indicadores',
    '/admin/conta',
    '/admin/pendentes',
    '/admin/pendentes/company-1',
    '/admin/empresas',
    '/admin/vagas',
    '/admin/contas',
    '/admin/candidatos',
    '/admin/listas',
  ])('Recrutador em %s vai para /acesso-negado (RF104)', async (path) => {
    withCompany('APPROVED');

    renderApp(path, signedInStore('RECRUITER'));

    await screen.findByRole('heading', { name: 'Acesso negado' });
    expect(location()).toBe('/acesso-negado');
    expect(indicatorService.get).not.toHaveBeenCalled();
  });

  it.each([
    ['/admin/pendentes', 'Empresas pendentes de aprovação'],
    ['/admin/empresas', 'Empresas'],
    ['/admin/vagas', 'Vagas publicadas'],
    ['/admin/contas', 'Contas de utilizador'],
    ['/admin/candidatos', 'Candidatos'],
    ['/admin/listas', 'Listas pré-definidas'],
  ])('Administrador abre %s dentro da moldura da supervisão', async (path, heading) => {
    renderApp(path, signedInStore('ADMIN'));

    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
    expect(location()).toBe(path);
    expect(screen.getByRole('navigation', { name: 'Navegação da supervisão' })).toBeInTheDocument();
  });

  it('Administrador abre o detalhe de uma Empresa pendente', async () => {
    adminCompanyService.getSubmittedData.mockResolvedValue(companyRegistrationDto());

    renderApp('/admin/pendentes/company-1', signedInStore('ADMIN'));

    expect(await screen.findByRole('heading', { name: 'Registo da Empresa' })).toBeInTheDocument();
    expect(adminCompanyService.getSubmittedData).toHaveBeenCalledWith('company-1');
  });

  it('Administrador abre /admin/indicadores e vê os indicadores', async () => {
    renderApp('/admin/indicadores', signedInStore('ADMIN'));

    expect(screen.getByRole('heading', { name: 'Painel de indicadores' })).toBeInTheDocument();
    await screen.findByText('Do interesse à conversa');
    expect(indicatorService.get).toHaveBeenCalledTimes(1);
  });

  it('a página de acesso negado volta ao início do perfil', async () => {
    renderApp('/acesso-negado', signedInStore('ADMIN'));

    screen.getByRole('link', { name: 'Voltar ao início' }).click();

    await screen.findByRole('heading', { name: 'Painel de indicadores' });
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

  it('Empresa suspensa continua a poder abrir /conversas dentro da moldura', async () => {
    withCompany('SUSPENDED');

    renderApp('/conversas', signedInStore('RECRUITER'));

    expect(await screen.findByRole('heading', { name: 'Conversas' })).toBeInTheDocument();
    expect(location()).toBe('/conversas');
  });

  it.each(['PENDING', 'REJECTED', 'SUSPENDED'] as const)(
    '/matches com a Empresa %s vai para /empresa/estado (a lista exige Empresa aprovada)',
    async (status) => {
      withCompany(status);

      renderApp('/matches', signedInStore('RECRUITER'));

      await screen.findByRole('heading', { name: 'Estado do pedido da Empresa' });
      expect(location()).toBe('/empresa/estado');
    },
  );

  it('/matches com a Empresa aprovada abre dentro da moldura', async () => {
    withCompany('APPROVED');

    renderApp('/matches', signedInStore('RECRUITER'));

    expect(await screen.findByRole('heading', { name: 'Matches da Empresa' })).toBeInTheDocument();
  });

  it.each(['PENDING', 'REJECTED', 'SUSPENDED'] as const)(
    '/candidatos com a Empresa %s vai para /empresa/estado, sem pedir nada ao servidor',
    async (status) => {
      withCompany(status);

      renderApp('/candidatos', signedInStore('RECRUITER'));

      await screen.findByRole('heading', { name: 'Estado do pedido da Empresa' });
      expect(location()).toBe('/empresa/estado');
      expect(jobService.list).not.toHaveBeenCalled();
    },
  );

  it('/candidatos com a Empresa aprovada abre dentro da moldura', async () => {
    withCompany('APPROVED');

    renderApp('/candidatos', signedInStore('RECRUITER'));

    expect(
      await screen.findByRole('heading', { name: 'Candidatos em espera' }),
    ).toBeInTheDocument();
  });

  it('/candidatos/:matchId abre o perfil do candidato com a Empresa aprovada', async () => {
    withCompany('APPROVED');
    candidateEvaluationService.openProfile.mockResolvedValue(candidateProfile());

    renderApp('/candidatos/match-1', signedInStore('RECRUITER'));

    expect(await screen.findByRole('heading', { name: /Ana Ferreira/ })).toBeInTheDocument();
    expect(screen.queryByText(/próxima versão/)).toBeNull();
    expect(location()).toBe('/candidatos/match-1');
  });

  it('/candidatos/:matchId/match sem estado segue para os matches, sem página provisória', async () => {
    withCompany('APPROVED');

    renderApp('/candidatos/match-1/match', signedInStore('RECRUITER'));

    expect(await screen.findByRole('heading', { name: 'Matches da Empresa' })).toBeInTheDocument();
    expect(location()).toBe('/matches');
  });

  it.each(['/candidatos/match-1', '/candidatos/match-1/match'])(
    '%s com a Empresa pendente vai para /empresa/estado, sem pedir o perfil',
    async (path) => {
      withCompany('PENDING');

      renderApp(path, signedInStore('RECRUITER'));

      await screen.findByRole('heading', { name: 'Estado do pedido da Empresa' });
      expect(location()).toBe('/empresa/estado');
      expect(candidateEvaluationService.openProfile).not.toHaveBeenCalled();
    },
  );

  it.each([null, 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'] as const)(
    '/conta abre com a Empresa em qualquer estado (%s)',
    async (status) => {
      withCompany(status);

      renderApp('/conta', signedInStore('RECRUITER'));

      expect(await screen.findByRole('heading', { name: 'Conta' })).toBeInTheDocument();
      expect(location()).toBe('/conta');
    },
  );

  it('Empresa suspensa não abre /vagas: vai para /empresa/estado', async () => {
    withCompany('SUSPENDED');

    renderApp('/vagas', signedInStore('RECRUITER'));

    await screen.findByRole('heading', { name: 'Estado do pedido da Empresa' });
    expect(location()).toBe('/empresa/estado');
  });

  // I070 — o ecrã das vagas só abre com a Empresa aprovada; a autorização é sempre do servidor (ERR-07).
  it.each([
    ['PENDING', '/vagas/nova'],
    ['REJECTED', '/vagas'],
    ['SUSPENDED', '/vagas/nova'],
    ['SUSPENDED', '/vagas/job-1/editar'],
  ] as const)('Empresa %s não abre %s: vai para /empresa/estado', async (status, path) => {
    withCompany(status);

    renderApp(path, signedInStore('RECRUITER'));

    await screen.findByRole('heading', { name: 'Estado do pedido da Empresa' });
    expect(location()).toBe('/empresa/estado');
    expect(jobService.list).not.toHaveBeenCalled();
  });

  it.each([
    ['/vagas', 'Vagas'],
    ['/vagas/nova', 'Criar vaga'],
  ])('com a Empresa aprovada, %s abre o ecrã das vagas', async (path, heading) => {
    withCompany('APPROVED');

    renderApp(path, signedInStore('RECRUITER'));

    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
    expect(location()).toBe(path);
  });

  // I121 — a página da Empresa só abre com a Empresa aprovada; a autorização é sempre do servidor (ERR-07).
  it('com a Empresa aprovada, /empresa abre o ecrã da Empresa', async () => {
    withCompany('APPROVED');

    renderApp('/empresa', signedInStore('RECRUITER'));

    expect(await screen.findByRole('heading', { name: 'Empresa' })).toBeInTheDocument();
    expect(location()).toBe('/empresa');
    expect(companyService.getPage).toHaveBeenCalledTimes(1);
  });

  it.each(['PENDING', 'REJECTED', 'SUSPENDED'] as const)(
    'Empresa %s não abre /empresa: vai para /empresa/estado e não pede a página',
    async (status) => {
      withCompany(status);

      renderApp('/empresa', signedInStore('RECRUITER'));

      await screen.findByRole('heading', { name: 'Estado do pedido da Empresa' });
      expect(location()).toBe('/empresa/estado');
      expect(companyService.getPage).not.toHaveBeenCalled();
    },
  );

  it('sem sessão, /empresa vai para o início de sessão', () => {
    renderApp('/empresa');

    expect(location()).toBe('/entrar');
    expect(companyService.getPage).not.toHaveBeenCalled();
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
