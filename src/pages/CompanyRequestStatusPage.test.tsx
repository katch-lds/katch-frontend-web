import { fireEvent, screen, within } from '@testing-library/react';
import { companyRegistration, companyRegistrationDto, companyStatus } from '../../test/fixtures';
import { renderApp, signedInStore } from '../../test/renderApp';
import { authService, companyService, resetServiceMocks } from '../../test/servicesMock';
import { ApiError } from '../api/ApiError';

jest.mock('../services', () => jest.requireActual('../../test/servicesMock'));

beforeEach(() => resetServiceMocks());

const nav = () => screen.getByRole('navigation', { name: 'Navegação do Recrutador' });

describe('CompanyRequestStatusPage — pendente (W05)', () => {
  it('mostra o estado, o aviso, os dados submetidos só de leitura e «Atualizar estado»', async () => {
    companyService.getStatus.mockResolvedValue(companyStatus());
    renderApp('/empresa/estado', signedInStore('RECRUITER'));

    expect(await screen.findByText('Pendente')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('A Empresa aguarda aprovação.');
    expect(
      screen.getByText('A Empresa não pode publicar vagas nem aceder a candidatos.'),
    ).toBeInTheDocument();
    expect(await screen.findByText('Café Central, Lda.')).toBeInTheDocument();
    expect(screen.getByText('123456789')).toBeInTheDocument();
    expect(screen.getByText('Hotelaria e restauração')).toBeInTheDocument();
    expect(screen.getByText('Braga (Braga)')).toBeInTheDocument();
    expect(screen.queryByLabelText('Nome da Empresa')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Atualizar estado' })).toBeInTheDocument();
  });

  it('o aviso de pendente usa o estilo informativo, não o de erro', async () => {
    companyService.getStatus.mockResolvedValue(companyStatus());
    renderApp('/empresa/estado', signedInStore('RECRUITER'));

    const notice = await screen.findByRole('status');

    expect(notice).toHaveClass('form-notice');
    expect(notice).not.toHaveClass('form-banner');
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

  it('se os dados de registo falharem, oferece «Tentar de novo»', async () => {
    companyService.getStatus.mockResolvedValue(companyStatus());
    companyService.getRegistration
      .mockRejectedValueOnce(ApiError.connectionFailure())
      .mockResolvedValue(companyRegistrationDto());
    renderApp('/empresa/estado', signedInStore('RECRUITER'));

    fireEvent.click(await screen.findByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByText('Café Central, Lda.')).toBeInTheDocument();
  });

  it('a barra lateral tem «Estado do pedido» e «Terminar sessão» termina a sessão', async () => {
    companyService.getStatus.mockResolvedValue(companyStatus());
    const store = renderApp('/empresa/estado', signedInStore('RECRUITER'));
    await screen.findByText('Pendente');

    expect(within(nav()).getByRole('link', { name: 'Estado do pedido' })).toBeInTheDocument();
    expect(within(nav()).queryByRole('link', { name: 'Vagas' })).not.toBeInTheDocument();
    fireEvent.click(within(nav()).getByRole('button', { name: 'Terminar sessão' }));

    await screen.findByRole('heading', { name: 'Início de sessão' });
    expect(store.get()).toBeNull();
    expect(authService.logout).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('location')).toHaveTextContent('/entrar');
  });
});

describe('CompanyRequestStatusPage — recusada (W06)', () => {
  const rejected = () =>
    companyService.getStatus.mockResolvedValue(
      companyStatus({ status: 'REJECTED', rejectionReason: 'NIF não confere.' }),
    );

  it('mostra o motivo em destaque e o formulário preenchido com os dados de registo', async () => {
    rejected();
    renderApp('/empresa/estado', signedInStore('RECRUITER'));

    expect(await screen.findByText('Recusada')).toBeInTheDocument();
    expect(screen.getByText('Motivo: NIF não confere.')).toHaveClass('form-banner');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(await screen.findByLabelText('Nome da Empresa')).toHaveValue('Café Central, Lda.');
    expect(screen.getByLabelText('NIF')).toHaveValue('123456789');
    expect(screen.getByLabelText('Área de atividade')).toHaveValue('HOSPITALITY');
    expect(await screen.findByLabelText('Localidade')).toHaveValue('loc-1');
    expect(screen.getByRole('button', { name: 'Submeter novamente' })).toBeInTheDocument();
  });

  it('«Submeter novamente» envia os dados corrigidos e passa a pendente (W05)', async () => {
    rejected();
    companyService.resubmit.mockResolvedValue(companyStatus());
    renderApp('/empresa/estado', signedInStore('RECRUITER'));
    fireEvent.change(await screen.findByLabelText('NIF'), { target: { value: '987654321' } });
    await screen.findByRole('option', { name: 'Braga (Braga)' });
    companyService.getStatus.mockResolvedValue(companyStatus());
    companyService.getRegistration.mockResolvedValue(
      companyRegistrationDto({ taxId: '987654321' }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Submeter novamente' }));

    expect(await screen.findByRole('status')).toHaveTextContent('A Empresa aguarda aprovação.');
    expect(companyService.resubmit).toHaveBeenCalledWith(
      companyRegistration({ taxId: '987654321' }),
    );
    expect(await screen.findByText('987654321')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submeter novamente' })).not.toBeInTheDocument();
  });

  it('valida antes de enviar: NIF inválido não chega ao servidor', async () => {
    rejected();
    renderApp('/empresa/estado', signedInStore('RECRUITER'));
    fireEvent.change(await screen.findByLabelText('NIF'), { target: { value: '12' } });
    await screen.findByRole('option', { name: 'Braga (Braga)' });

    fireEvent.click(screen.getByRole('button', { name: 'Submeter novamente' }));

    expect(screen.getByLabelText('NIF')).toHaveAccessibleDescription(
      'O NIF deve ter 9 algarismos.',
    );
    expect(companyService.resubmit).not.toHaveBeenCalled();
  });

  it('ERR-10: mostra cada motivo do servidor junto do campo', async () => {
    rejected();
    companyService.resubmit.mockRejectedValue(
      new ApiError(400, 'Dados inválidos.', 'ERR-10', [
        { field: 'contactPhone', reason: 'O telefone não é válido.' },
      ]),
    );
    renderApp('/empresa/estado', signedInStore('RECRUITER'));
    await screen.findByLabelText('NIF');
    await screen.findByRole('option', { name: 'Braga (Braga)' });

    fireEvent.click(screen.getByRole('button', { name: 'Submeter novamente' }));

    expect(await screen.findByText('O telefone não é válido.')).toBeInTheDocument();
    expect(screen.getByLabelText('Telefone de contacto')).toHaveFocus();
  });

  it('ERR-30: a Empresa já não está recusada, lê o estado e mostra o ecrã do estado novo', async () => {
    rejected();
    companyService.resubmit.mockRejectedValue(
      new ApiError(409, 'A Empresa não está recusada.', 'ERR-30'),
    );
    renderApp('/empresa/estado', signedInStore('RECRUITER'));
    await screen.findByLabelText('NIF');
    await screen.findByRole('option', { name: 'Braga (Braga)' });
    companyService.getStatus.mockResolvedValue(companyStatus());

    fireEvent.click(screen.getByRole('button', { name: 'Submeter novamente' }));

    expect(await screen.findByRole('status')).toHaveTextContent('A Empresa aguarda aprovação.');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('CompanyRequestStatusPage — suspensa (W26)', () => {
  beforeEach(() => {
    companyService.getStatus.mockResolvedValue(
      companyStatus({ status: 'SUSPENDED', rejectionReason: 'Denúncias.' }),
    );
  });

  it('mostra o estado, o motivo e os dados só de leitura, sem formulário', async () => {
    renderApp('/empresa/estado', signedInStore('RECRUITER'));

    expect(await screen.findByText('Suspensa')).toBeInTheDocument();
    expect(screen.getByText('Motivo: Denúncias.')).not.toHaveClass('form-banner');
    expect(await screen.findByText('Café Central, Lda.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Nome da Empresa')).not.toBeInTheDocument();
    expect(
      screen.getByText('A Empresa não pode publicar vagas nem aceder a candidatos.'),
    ).toBeInTheDocument();
  });

  it('dá acesso às Conversas (só de consulta) mas não aos Matches', async () => {
    renderApp('/empresa/estado', signedInStore('RECRUITER'));
    await screen.findByText('Suspensa');

    expect(within(nav()).getByRole('link', { name: 'Conversas' })).toHaveAttribute(
      'href',
      '/conversas',
    );
    expect(within(nav()).queryByRole('link', { name: 'Matches' })).not.toBeInTheDocument();
    expect(within(nav()).getByText('Matches')).toHaveAttribute('aria-disabled', 'true');
  });
});
