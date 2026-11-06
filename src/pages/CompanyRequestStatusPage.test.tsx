import { fireEvent, screen } from '@testing-library/react';
import { companyStatus } from '../../test/fixtures';
import { renderApp, signedInStore } from '../../test/renderApp';
import { authService, companyService, resetServiceMocks } from '../../test/servicesMock';
import { ApiError } from '../api/ApiError';

jest.mock('../services', () => jest.requireActual('../../test/servicesMock'));

beforeEach(() => resetServiceMocks());

describe('CompanyRequestStatusPage', () => {
  it('W05: Empresa pendente mostra o estado, o aviso e «Atualizar estado»', async () => {
    companyService.getStatus.mockResolvedValue(companyStatus());
    renderApp('/empresa/estado', signedInStore('RECRUITER'));

    expect(await screen.findByText('Pendente')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'não pode publicar vagas nem aceder a candidatos',
    );
    expect(screen.getByRole('button', { name: 'Atualizar estado' })).toBeInTheDocument();
  });

  it('«Atualizar estado» lê o estado e, com a Empresa aprovada, segue para /vagas', async () => {
    companyService.getStatus.mockResolvedValueOnce(companyStatus());
    renderApp('/empresa/estado', signedInStore('RECRUITER'));
    await screen.findByText('Pendente');
    companyService.getStatus.mockResolvedValue(companyStatus({ status: 'APPROVED' }));

    fireEvent.click(screen.getByRole('button', { name: 'Atualizar estado' }));

    await screen.findByRole('heading', { name: 'Vagas' });
    expect(screen.getByTestId('location')).toHaveTextContent('/vagas');
  });

  it('se a atualização falhar, mostra o erro e mantém o estado', async () => {
    companyService.getStatus.mockResolvedValueOnce(companyStatus());
    renderApp('/empresa/estado', signedInStore('RECRUITER'));
    await screen.findByText('Pendente');
    companyService.getStatus.mockRejectedValue(ApiError.connectionFailure());

    fireEvent.click(screen.getByRole('button', { name: 'Atualizar estado' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível contactar');
    expect(screen.getByText('Pendente')).toBeInTheDocument();
  });

  it('Empresa recusada mostra só o estado e o motivo, sem aviso de pendente', async () => {
    companyService.getStatus.mockResolvedValue(
      companyStatus({ status: 'REJECTED', rejectionReason: 'NIF não confere.' }),
    );
    renderApp('/empresa/estado', signedInStore('RECRUITER'));

    expect(await screen.findByText('Recusada')).toBeInTheDocument();
    expect(screen.getByText('Motivo: NIF não confere.')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Nome da Empresa')).not.toBeInTheDocument();
  });

  it('Empresa suspensa mostra o estado, o motivo e o acesso a Matches e Conversas', async () => {
    companyService.getStatus.mockResolvedValue(
      companyStatus({ status: 'SUSPENDED', rejectionReason: 'Denúncias.' }),
    );
    renderApp('/empresa/estado', signedInStore('RECRUITER'));

    expect(await screen.findByText('Suspensa')).toBeInTheDocument();
    expect(screen.getByText('Motivo: Denúncias.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Matches' })).toHaveAttribute('href', '/matches');
    expect(screen.getByRole('link', { name: 'Conversas' })).toHaveAttribute('href', '/conversas');
  });

  it('«Terminar sessão» descarta a sessão e volta ao início de sessão', async () => {
    companyService.getStatus.mockResolvedValue(companyStatus());
    const store = renderApp('/empresa/estado', signedInStore('RECRUITER'));
    await screen.findByText('Pendente');

    fireEvent.click(screen.getByRole('button', { name: 'Terminar sessão' }));

    await screen.findByRole('heading', { name: 'Início de sessão' });
    expect(store.get()).toBeNull();
    expect(authService.logout).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('location')).toHaveTextContent('/entrar');
  });
});
