import { fireEvent, screen, waitFor } from '@testing-library/react';
import { companyRegistration, companyStatus } from '../../test/fixtures';
import { renderApp, signedInStore } from '../../test/renderApp';
import { companyService, referenceListService, resetServiceMocks } from '../../test/servicesMock';
import { ApiError } from '../api/ApiError';
import type { CompanyRegistrationRequest } from '../types/api';

jest.mock('../services', () => jest.requireActual('../../test/servicesMock'));

const labels: Record<keyof CompanyRegistrationRequest, string> = {
  companyName: 'Nome da Empresa',
  taxId: 'NIF',
  industry: 'Área de atividade',
  address: 'Morada',
  locationId: 'Localidade',
  contactEmail: 'E-mail de contacto',
  contactPhone: 'Telefone de contacto',
  responsibleName: 'Nome do responsável',
};

async function renderForm() {
  companyService.getStatus.mockResolvedValue(null);
  renderApp('/empresa/registo', signedInStore('RECRUITER'));
  await screen.findByRole('option', { name: 'Braga (Braga)' });
}

/** Preenche os oito campos com os valores indicados (por omissão, os válidos). */
function fillForm(overrides: Partial<CompanyRegistrationRequest> = {}) {
  const values = { ...companyRegistration(), ...overrides };
  (Object.keys(labels) as (keyof CompanyRegistrationRequest)[]).forEach((field) => {
    fireEvent.change(screen.getByLabelText(labels[field]), { target: { value: values[field] } });
  });
}

const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Pedir aprovação' }));

beforeEach(() => resetServiceMocks());

describe('CompanyRegistrationPage', () => {
  it('W03: mostra os oito campos, a localidade vem da lista e a área da lista de áreas', async () => {
    await renderForm();

    Object.values(labels).forEach((label) =>
      expect(screen.getByLabelText(label)).toBeInTheDocument(),
    );
    expect(screen.getByRole('option', { name: 'Hotelaria e restauração' })).toBeInTheDocument();
    expect(screen.getByLabelText('Localidade')).toBeEnabled();
  });

  it('regista a Empresa com o texto aparado e segue para /empresa/estado', async () => {
    companyService.register.mockResolvedValue(companyStatus());
    await renderForm();
    companyService.getStatus.mockResolvedValue(companyStatus());

    fillForm({ companyName: '  Café Central, Lda.  ' });
    submit();

    await screen.findByRole('heading', { name: 'Estado do pedido da Empresa' });
    expect(screen.getByTestId('location')).toHaveTextContent('/empresa/estado');
    expect(companyService.register).toHaveBeenCalledWith(companyRegistration());
  });

  it('W04: com NIF e telefone inválidos mostra o aviso e o motivo junto de cada campo', async () => {
    await renderForm();

    fillForm({ taxId: '12345', contactPhone: '25312' });
    submit();

    expect(screen.getByRole('alert')).toHaveTextContent('Corrija os campos indicados');
    expect(screen.getByLabelText('NIF')).toHaveAccessibleDescription(
      'O NIF deve ter 9 algarismos.',
    );
    expect(screen.getByLabelText('Telefone de contacto')).toHaveAccessibleDescription(
      'O telefone de contacto deve ter 9 algarismos.',
    );
    expect(screen.getByLabelText('NIF')).toHaveFocus();
    expect(companyService.register).not.toHaveBeenCalled();
  });

  it('assinala todos os campos obrigatórios por preencher', async () => {
    await renderForm();

    submit();

    expect(document.querySelectorAll('.form-error')).toHaveLength(8);
  });

  it('ERR-10: mostra cada motivo do servidor junto do campo certo', async () => {
    companyService.register.mockRejectedValue(
      new ApiError(400, 'Dados inválidos.', 'ERR-10', [
        { field: 'taxId', reason: 'O NIF não é válido.' },
        { field: 'contactPhone', reason: 'O telefone não é válido.' },
      ]),
    );
    await renderForm();

    fillForm();
    submit();

    expect(await screen.findByText('O NIF não é válido.')).toBeInTheDocument();
    expect(screen.getByLabelText('NIF')).toHaveAccessibleDescription('O NIF não é válido.');
    expect(screen.getByLabelText('Telefone de contacto')).toHaveAccessibleDescription(
      'O telefone não é válido.',
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Corrija os campos indicados');
  });

  it('ERR-40: a Empresa já existe, lê o estado e segue para /empresa/estado', async () => {
    companyService.register.mockRejectedValue(
      new ApiError(409, 'Já existe uma Empresa.', 'ERR-40'),
    );
    await renderForm();
    companyService.getStatus.mockResolvedValue(companyStatus({ status: 'REJECTED' }));

    fillForm();
    submit();

    await screen.findByRole('heading', { name: 'Estado do pedido da Empresa' });
    expect(screen.getByTestId('location')).toHaveTextContent('/empresa/estado');
    expect(screen.getByText('Recusada')).toBeInTheDocument();
  });

  it('outro erro de servidor aparece no aviso do formulário', async () => {
    companyService.register.mockRejectedValue(new ApiError(500, 'Erro interno.', 'ERR-99'));
    await renderForm();

    fillForm();
    submit();

    expect(await screen.findByRole('alert')).toHaveTextContent('Erro interno.');
    expect(screen.getByTestId('location')).toHaveTextContent('/empresa/registo');
  });

  it('localidades em falta: mostra a falha e «Tentar de novo» volta a pedi-las', async () => {
    referenceListService.listLocations
      .mockRejectedValueOnce(ApiError.connectionFailure())
      .mockResolvedValueOnce([{ id: 'loc-1', name: 'Braga (Braga)' }]);
    companyService.getStatus.mockResolvedValue(null);
    renderApp('/empresa/registo', signedInStore('RECRUITER'));

    expect(await screen.findByText(/Não foi possível contactar o servidor/)).toBeInTheDocument();
    expect(screen.getByLabelText('Localidade')).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    await screen.findByRole('option', { name: 'Braga (Braga)' });
    await waitFor(() => expect(screen.getByLabelText('Localidade')).toBeEnabled());
  });

  it('enquanto a lista não chega, a localidade mostra «A carregar…»', async () => {
    referenceListService.listLocations.mockReturnValue(new Promise(() => undefined));
    companyService.getStatus.mockResolvedValue(null);
    renderApp('/empresa/registo', signedInStore('RECRUITER'));

    expect(await screen.findByRole('option', { name: 'A carregar…' })).toBeInTheDocument();
    expect(screen.getByLabelText('Localidade')).toBeDisabled();
  });
});
