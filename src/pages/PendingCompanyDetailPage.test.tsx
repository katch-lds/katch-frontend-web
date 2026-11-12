import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { companyRegistrationDto, pendingCompany } from '../../test/fixtures';
import { renderApp, signedInStore } from '../../test/renderApp';
import { adminCompanyService, resetServiceMocks } from '../../test/servicesMock';
import { ApiError } from '../api/ApiError';

jest.mock('../services', () => jest.requireActual('../../test/servicesMock'));

const { approve, reject, listPending, getSubmittedData } = adminCompanyService;

const location = () => screen.getByTestId('location').textContent;
const registration = () =>
  companyRegistrationDto({
    companyName: 'Lumen Software, Lda.',
    taxId: '509123456',
    industry: 'TECHNOLOGY',
    address: 'Avenida da Liberdade, 100, 4710-000 Braga',
    locationName: 'Braga (Braga)',
    contactEmail: 'geral@lumen-exemplo.pt',
    contactPhone: '253000111',
    responsibleName: 'Rui Matos',
    submittedAt: '2026-10-05T10:00:00Z',
  });

async function openDetail() {
  renderApp('/admin/pendentes/company-1', signedInStore('ADMIN'));
  await screen.findByText('Rui Matos');
}

const openRejectDialog = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Recusar registo' }));
  return screen.findByRole('dialog', { name: 'Recusar registo' });
};

const writeReason = (dialog: HTMLElement, reason: string) =>
  fireEvent.change(within(dialog).getByLabelText('Motivo da recusa'), {
    target: { value: reason },
  });

const submitReason = (dialog: HTMLElement) =>
  fireEvent.click(within(dialog).getByRole('button', { name: 'Recusar registo' }));

beforeEach(() => {
  resetServiceMocks();
  getSubmittedData.mockResolvedValue(registration());
  listPending.mockResolvedValue([pendingCompany()]);
});

describe('PendingCompanyDetailPage (A04)', () => {
  it('mostra os oito dados submetidos, a data de submissão e o estado pendente', async () => {
    await openDetail();

    expect(getSubmittedData).toHaveBeenCalledWith('company-1');
    [
      'Lumen Software, Lda.',
      '509123456',
      'Tecnologia',
      'Avenida da Liberdade, 100, 4710-000 Braga',
      'Braga (Braga)',
      'geral@lumen-exemplo.pt',
      '253000111',
      'Rui Matos',
    ].forEach((value) => expect(screen.getByText(value)).toBeInTheDocument());
    expect(screen.getByText(/05\/10\/2026/)).toBeInTheDocument();
    expect(screen.getByText('Pendente')).toBeInTheDocument();
  });

  it('mostra o erro 404 ERR-20 da leitura, com «Tentar de novo»', async () => {
    getSubmittedData.mockRejectedValueOnce(
      new ApiError(404, 'O elemento pedido não existe ou não está disponível.', 'ERR-20'),
    );
    renderApp('/admin/pendentes/company-9', signedInStore('ADMIN'));

    expect(await screen.findByRole('alert')).toHaveTextContent('não existe');
    getSubmittedData.mockResolvedValue(registration());
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByText('Rui Matos')).toBeInTheDocument();
  });

  describe('aprovar (A04b)', () => {
    it('pede confirmação antes de aprovar e cancelar não faz nenhum pedido', async () => {
      await openDetail();

      fireEvent.click(screen.getByRole('button', { name: 'Aprovar registo' }));
      const dialog = await screen.findByRole('dialog', { name: 'Aprovar registo' });
      fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(approve).not.toHaveBeenCalled();
    });

    it('depois de confirmar volta à lista, com a mensagem (A03b) e a lista lida de novo', async () => {
      approve.mockResolvedValue(undefined);
      await openDetail();
      listPending.mockResolvedValue([]);

      fireEvent.click(screen.getByRole('button', { name: 'Aprovar registo' }));
      const dialog = await screen.findByRole('dialog', { name: 'Aprovar registo' });
      fireEvent.click(within(dialog).getByRole('button', { name: 'Aprovar registo' }));

      const notice = await screen.findByRole('status');
      expect(notice).toHaveTextContent('Registo de «Lumen Software, Lda.» aprovado.');
      expect(notice.textContent).not.toMatch(/avis/i);
      expect(approve).toHaveBeenCalledWith('company-1');
      expect(location()).toBe('/admin/pendentes');
      expect(await screen.findByText('Não há Empresas a aguardar aprovação.')).toBeInTheDocument();
    });

    it('a Empresa já decidida (409 ERR-30) mostra a mensagem e «Ver lista atualizada» (A04e)', async () => {
      approve.mockRejectedValue(
        new ApiError(409, 'A operação não é permitida no estado atual: aprovada.', 'ERR-30'),
      );
      await openDetail();

      fireEvent.click(screen.getByRole('button', { name: 'Aprovar registo' }));
      const dialog = await screen.findByRole('dialog', { name: 'Aprovar registo' });
      fireEvent.click(within(dialog).getByRole('button', { name: 'Aprovar registo' }));

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('não é permitida no estado atual');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Aprovar registo' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Recusar registo' })).not.toBeInTheDocument();
      listPending.mockResolvedValue([]);
      fireEvent.click(within(alert).getByRole('button', { name: 'Ver lista atualizada' }));

      expect(location()).toBe('/admin/pendentes');
      expect(await screen.findByText('Não há Empresas a aguardar aprovação.')).toBeInTheDocument();
    });

    it('outra falha (ligação) fecha o diálogo, mostra o aviso e «Tentar de novo» volta a pedir confirmação', async () => {
      approve.mockRejectedValue(ApiError.connectionFailure());
      await openDetail();

      fireEvent.click(screen.getByRole('button', { name: 'Aprovar registo' }));
      const dialog = await screen.findByRole('dialog', { name: 'Aprovar registo' });
      fireEvent.click(within(dialog).getByRole('button', { name: 'Aprovar registo' }));

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Não foi possível contactar o servidor');
      expect(location()).toBe('/admin/pendentes/company-1');
      fireEvent.click(within(alert).getByRole('button', { name: 'Tentar de novo' }));

      expect(await screen.findByRole('dialog', { name: 'Aprovar registo' })).toBeInTheDocument();
    });
  });

  describe('recusar com motivo (A04c e A04d; P12: 10 a 500 caracteres)', () => {
    it.each([9, 501])(
      'um motivo com %i caracteres é rejeitado no cliente, sem pedido',
      async (length) => {
        await openDetail();
        const dialog = await openRejectDialog();

        writeReason(dialog, 'a'.repeat(length));
        submitReason(dialog);

        expect(
          await within(dialog).findByText('O motivo tem de ter entre 10 e 500 caracteres.'),
        ).toBeInTheDocument();
        expect(reject).not.toHaveBeenCalled();
        expect(screen.getByRole('dialog', { name: 'Recusar registo' })).toBeInTheDocument();
      },
    );

    it('um motivo vazio ou só com espaços é rejeitado', async () => {
      await openDetail();
      const dialog = await openRejectDialog();

      writeReason(dialog, '          ');
      submitReason(dialog);

      expect(await within(dialog).findByText(/entre 10 e 500 caracteres/)).toBeInTheDocument();
      expect(reject).not.toHaveBeenCalled();
    });

    it.each([10, 500])('um motivo com %i caracteres é aceite e enviado', async (length) => {
      reject.mockResolvedValue(undefined);
      await openDetail();
      const dialog = await openRejectDialog();
      const reason = 'a'.repeat(length);

      writeReason(dialog, reason);
      submitReason(dialog);

      await waitFor(() => expect(reject).toHaveBeenCalledWith('company-1', { reason }));
    });

    it('mostra o contador de caracteres', async () => {
      await openDetail();
      const dialog = await openRejectDialog();

      writeReason(dialog, 'Morada errada');

      expect(within(dialog).getByText('13 de 500 caracteres (mínimo 10)')).toBeInTheDocument();
    });

    it('depois de recusar volta à lista, com a mensagem (A03c) e a lista lida de novo', async () => {
      reject.mockResolvedValue(undefined);
      await openDetail();
      listPending.mockResolvedValue([]);
      const dialog = await openRejectDialog();

      writeReason(dialog, 'A morada não corresponde à certidão permanente.');
      submitReason(dialog);

      const notice = await screen.findByRole('status');
      expect(notice).toHaveTextContent('Registo de «Lumen Software, Lda.» recusado.');
      expect(notice.textContent).not.toMatch(/avis/i);
      expect(location()).toBe('/admin/pendentes');
      expect(await screen.findByText('Não há Empresas a aguardar aprovação.')).toBeInTheDocument();
    });

    it('o 400 ERR-10 do servidor aparece no campo do motivo e o diálogo fica aberto', async () => {
      reject.mockRejectedValue(
        new ApiError(400, 'Os dados enviados não cumprem a validação automática.', 'ERR-10', [
          { field: 'reason', reason: 'O motivo tem de ter entre 10 e 500 caracteres.' },
        ]),
      );
      await openDetail();
      const dialog = await openRejectDialog();

      writeReason(dialog, 'Motivo com tamanho válido.');
      submitReason(dialog);

      const field = within(dialog).getByLabelText('Motivo da recusa');
      await waitFor(() => expect(field).toHaveAttribute('aria-invalid', 'true'));
      expect(
        within(dialog).getByText('O motivo tem de ter entre 10 e 500 caracteres.'),
      ).toBeInTheDocument();
      expect(location()).toBe('/admin/pendentes/company-1');
    });

    it('a Empresa já decidida (409 ERR-30) mostra a mensagem e «Ver lista atualizada» (A04e)', async () => {
      reject.mockRejectedValue(
        new ApiError(409, 'A operação não é permitida no estado atual: recusada.', 'ERR-30'),
      );
      await openDetail();
      const dialog = await openRejectDialog();

      writeReason(dialog, 'A morada não corresponde à certidão permanente.');
      submitReason(dialog);

      expect(
        await screen.findByRole('button', { name: 'Ver lista atualizada' }),
      ).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('«Cancelar» e Escape fecham o diálogo sem pedido', async () => {
      await openDetail();
      let dialog = await openRejectDialog();

      fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      dialog = await openRejectDialog();
      fireEvent.keyDown(dialog, { key: 'Escape' });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(reject).not.toHaveBeenCalled();
    });
  });
});
