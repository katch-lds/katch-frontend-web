import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { companyPageDto, companyStatus } from '../../test/fixtures';
import { companyService, resetServiceMocks } from '../../test/servicesMock';
import { ApiError } from '../api/ApiError';
import { SessionContext, type SessionState } from '../session/SessionProvider';
import { BYTES_PER_MB } from '../validation/company';
import CompanyProfilePage from './CompanyProfilePage';

jest.mock('../services', () => jest.requireActual('../../test/servicesMock'));
// O ficheiro protegido é servido com a credencial; nos testes o endereço serve de fonte da imagem.
jest.mock('../hooks/useProtectedFile', () => ({ useProtectedFile: (url: string | null) => url }));

const refreshCompanyStatus = jest.fn();

function renderPage() {
  const session: SessionState = {
    session: null,
    companyStatus: companyStatus({ status: 'APPROVED' }),
    companyLoaded: true,
    companyError: null,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    refreshCompanyStatus,
  };
  render(
    <MemoryRouter>
      <SessionContext.Provider value={session}>
        <CompanyProfilePage />
      </SessionContext.Provider>
    </MemoryRouter>,
  );
}

function file(name: string, type: string, size = 1000): File {
  const result = new File(['x'], name, { type });
  Object.defineProperty(result, 'size', { value: size });
  return result;
}

const choose = (label: string, chosen: File) =>
  fireEvent.change(screen.getByLabelText(label), { target: { files: [chosen] } });

const photoUrls = (count: number) =>
  Array.from({ length: count }, (_, index) => `/api/files/COMPANY_PHOTO/${index}.jpg`);

async function openPage(overrides = {}) {
  companyService.getPage.mockResolvedValue(companyPageDto(overrides));
  renderPage();
  await screen.findByRole('tab', { name: 'Página da Empresa' });
}

async function openDataTab() {
  await openPage();
  fireEvent.click(screen.getByRole('tab', { name: 'Dados da Empresa' }));
  await screen.findByRole('option', { name: 'Braga (Braga)' });
}

beforeEach(() => {
  resetServiceMocks();
  refreshCompanyStatus.mockResolvedValue(undefined);
});

describe('CompanyProfilePage — página da Empresa (W07)', () => {
  it('mostra a página gravada, o logótipo, as fotografias e o contador n/6', async () => {
    await openPage({
      logoUrl: '/api/files/COMPANY_LOGO/logo.png',
      photoUrls: photoUrls(3),
    });

    expect(screen.getByRole('heading', { name: 'Empresa' })).toBeInTheDocument();
    expect(screen.getByLabelText('Descrição')).toHaveValue(
      'Café e restaurante no centro de Braga.',
    );
    expect(screen.getByLabelText('Sítio na Internet')).toHaveValue('https://www.cafecentral.pt');
    expect(screen.getByText('38/1000')).toBeInTheDocument();
    expect(screen.getByAltText('Logótipo da Empresa')).toBeInTheDocument();
    expect(screen.getByAltText('Fotografia 1 da galeria')).toBeInTheDocument();
    expect(screen.getByAltText('Fotografia 3 da galeria')).toBeInTheDocument();
    expect(screen.getByText('3/6')).toBeInTheDocument();
    expect(screen.getByText('JPEG ou PNG até 2 MB')).toBeInTheDocument();
    expect(screen.getByText('Até 6 fotografias, JPEG ou PNG até 5 MB cada')).toBeInTheDocument();
    expect(screen.getByText('Começa por http:// ou https://')).toBeInTheDocument();
  });

  it('tem dois separadores acessíveis e o da página está selecionado', async () => {
    await openPage();

    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Página da Empresa' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: 'Dados da Empresa' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
    expect(screen.getByRole('tabpanel', { name: 'Página da Empresa' })).toBeInTheDocument();
  });

  it('gravar a página chama updatePage, mostra a confirmação e volta a pedir a página', async () => {
    companyService.updatePage.mockResolvedValue(companyPageDto());
    await openPage({ description: null, website: null });

    fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: '  Café central  ' } });
    fireEvent.change(screen.getByLabelText('Sítio na Internet'), {
      target: { value: 'https://www.cafecentral.pt' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Página guardada');
    expect(companyService.updatePage).toHaveBeenCalledWith({
      description: 'Café central',
      website: 'https://www.cafecentral.pt',
    });
    await waitFor(() => expect(companyService.getPage).toHaveBeenCalledTimes(2));
  });

  it('campos vazios vão como null', async () => {
    companyService.updatePage.mockResolvedValue(companyPageDto());
    await openPage();

    fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Sítio na Internet'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await screen.findByText('Página guardada');
    expect(companyService.updatePage).toHaveBeenCalledWith({ description: null, website: null });
  });

  it('um sítio sem http:// ou https:// é recusado no cliente, sem pedido', async () => {
    await openPage();

    fireEvent.change(screen.getByLabelText('Sítio na Internet'), {
      target: { value: 'www.cafecentral.pt' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText(/começar por http:\/\/ ou https:\/\//)).toBeInTheDocument();
    expect(companyService.updatePage).not.toHaveBeenCalled();
  });

  it('o erro ERR-10 da API aparece junto do campo do sítio', async () => {
    companyService.updatePage.mockRejectedValue(
      new ApiError(400, 'Dados inválidos.', 'ERR-10', [
        { field: 'website', reason: 'O sítio tem de começar por http:// ou https://.' },
      ]),
    );
    await openPage();

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    const field = screen.getByLabelText('Sítio na Internet');
    await waitFor(() => expect(field).toHaveAccessibleDescription(/começar por http/));
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByText('Página guardada')).not.toBeInTheDocument();
  });

  it('o duplo clique em «Guardar» não envia dois pedidos', async () => {
    companyService.updatePage.mockReturnValue(new Promise(() => undefined));
    await openPage();
    const form = screen.getByRole('button', { name: 'Guardar' }).closest('form') as HTMLFormElement;

    fireEvent.submit(form);
    fireEvent.submit(form);

    expect(companyService.updatePage).toHaveBeenCalledTimes(1);
  });
});

describe('CompanyProfilePage — logótipo', () => {
  it.each([
    ['um GIF', file('logo.gif', 'image/gif'), /JPEG ou PNG/],
    ['um PNG acima de 2 MB', file('logo.png', 'image/png', 2 * BYTES_PER_MB + 1), /2 MB/],
  ])('%s é recusado junto do campo, sem pedido', async (_name, chosen, message) => {
    await openPage();

    choose('Escolher', chosen);

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(companyService.uploadLogo).not.toHaveBeenCalled();
  });

  it('um PNG válido (2 MB exatos) chama uploadLogo e mostra o novo logótipo', async () => {
    companyService.uploadLogo.mockResolvedValue('/api/files/COMPANY_LOGO/novo.png');
    await openPage();
    expect(screen.getByRole('img', { name: 'Logótipo da Empresa' })).toBeInTheDocument();
    companyService.getPage.mockResolvedValue(
      companyPageDto({ logoUrl: '/api/files/COMPANY_LOGO/novo.png' }),
    );

    const chosen = file('logo.png', 'image/png', 2 * BYTES_PER_MB);
    choose('Escolher', chosen);

    await waitFor(() =>
      expect(screen.getByAltText('Logótipo da Empresa')).toHaveAttribute(
        'src',
        '/api/files/COMPANY_LOGO/novo.png',
      ),
    );
    expect(companyService.uploadLogo).toHaveBeenCalledWith(chosen);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it.each([
    [400, 'ERR-11', 'O conteúdo do ficheiro não é uma imagem JPEG ou PNG.'],
    [415, 'ERR-13', 'O formato do ficheiro não é admitido.'],
    [413, 'ERR-12', 'O ficheiro excede a dimensão máxima.'],
  ])(
    'o servidor recusa o logótipo com %s %s: mostra a mensagem do servidor',
    async (status, code, message) => {
      companyService.uploadLogo.mockRejectedValue(new ApiError(status, message, code));
      await openPage({ logoUrl: '/api/files/COMPANY_LOGO/atual.png' });

      choose('Escolher', file('foto.png', 'image/png'));

      expect(await screen.findByRole('alert')).toHaveTextContent(message);
      expect(screen.getByAltText('Logótipo da Empresa')).toHaveAttribute(
        'src',
        '/api/files/COMPANY_LOGO/atual.png',
      );
      expect(companyService.getPage).toHaveBeenCalledTimes(1);
    },
  );

  it('não envia o mesmo ficheiro duas vezes enquanto o pedido corre', async () => {
    companyService.uploadLogo.mockReturnValue(new Promise(() => undefined));
    await openPage();
    const chosen = file('logo.png', 'image/png');

    choose('Escolher', chosen);
    choose('Escolher', chosen);

    expect(companyService.uploadLogo).toHaveBeenCalledTimes(1);
  });
});

describe('CompanyProfilePage — galeria', () => {
  it('um GIF é recusado sem pedido', async () => {
    await openPage({ photoUrls: photoUrls(2) });

    choose('Adicionar fotografia', file('sala.gif', 'image/gif'));

    expect(await screen.findByRole('alert')).toHaveTextContent(/JPEG ou PNG/);
    expect(companyService.addGalleryPhoto).not.toHaveBeenCalled();
  });

  it('uma fotografia acima de 5 MB é recusada sem pedido; 5 MB exatos são aceites', async () => {
    companyService.addGalleryPhoto.mockResolvedValue('/api/files/COMPANY_PHOTO/n.jpg');
    await openPage({ photoUrls: photoUrls(2) });

    choose('Adicionar fotografia', file('grande.jpg', 'image/jpeg', 5 * BYTES_PER_MB + 1));
    expect(await screen.findByRole('alert')).toHaveTextContent(/5 MB/);
    expect(companyService.addGalleryPhoto).not.toHaveBeenCalled();

    companyService.getPage.mockResolvedValue(companyPageDto({ photoUrls: photoUrls(3) }));
    choose('Adicionar fotografia', file('exata.jpg', 'image/jpeg', 5 * BYTES_PER_MB));

    expect(await screen.findByText('3/6')).toBeInTheDocument();
    expect(companyService.addGalleryPhoto).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('com 6 fotografias o botão «Adicionar fotografia» fica desativado', async () => {
    await openPage({ photoUrls: photoUrls(6) });

    expect(screen.getByText('6/6')).toBeInTheDocument();
    expect(screen.getByLabelText('Adicionar fotografia')).toBeDisabled();
  });

  it('o servidor recusa o ficheiro (ERR-11): mostra a mensagem e o contador não muda', async () => {
    companyService.addGalleryPhoto.mockRejectedValue(
      new ApiError(400, 'O conteúdo do ficheiro não é uma imagem JPEG ou PNG.', 'ERR-11'),
    );
    await openPage({ photoUrls: photoUrls(2) });

    choose('Adicionar fotografia', file('foto.png', 'image/png'));

    expect(await screen.findByRole('alert')).toHaveTextContent(/não é uma imagem/);
    expect(screen.getByText('2/6')).toBeInTheDocument();
    expect(companyService.getPage).toHaveBeenCalledTimes(1);
  });

  it('o servidor recusa por dimensão (ERR-12): mostra a mensagem e o contador não muda', async () => {
    companyService.addGalleryPhoto.mockRejectedValue(
      new ApiError(413, 'O ficheiro excede a dimensão máxima.', 'ERR-12'),
    );
    await openPage({ photoUrls: photoUrls(1) });

    choose('Adicionar fotografia', file('foto.jpg', 'image/jpeg'));

    expect(await screen.findByRole('alert')).toHaveTextContent(/dimensão máxima/);
    expect(screen.getByText('1/6')).toBeInTheDocument();
  });

  it('ERR-39 mostra a mensagem do servidor e atualiza o contador', async () => {
    companyService.addGalleryPhoto.mockRejectedValue(
      new ApiError(409, 'A galeria já tem 6 fotografias.', 'ERR-39'),
    );
    await openPage({ photoUrls: photoUrls(5) });
    companyService.getPage.mockResolvedValue(companyPageDto({ photoUrls: photoUrls(6) }));

    choose('Adicionar fotografia', file('sexta.jpg', 'image/jpeg'));

    expect(await screen.findByText('A galeria já tem 6 fotografias.')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('6/6')).toBeInTheDocument());
    expect(screen.getByLabelText('Adicionar fotografia')).toBeDisabled();
  });
});

describe('CompanyProfilePage — dados da Empresa (W08)', () => {
  it('mostra o formulário pré-preenchido, com o NIF só de leitura e o estado Aprovada', async () => {
    await openDataTab();

    const panel = screen.getByRole('tabpanel', { name: 'Dados da Empresa' });
    expect(within(panel).getByLabelText('Nome da Empresa')).toHaveValue('Café Central, Lda.');
    expect(within(panel).getByLabelText('NIF')).toHaveValue('123456789');
    expect(within(panel).getByLabelText('NIF')).toHaveAttribute('readonly');
    expect(
      within(panel).getByText('O NIF não pode ser alterado depois da aprovação.'),
    ).toBeInTheDocument();
    expect(within(panel).getByText('Aprovada')).toBeInTheDocument();
    expect(within(panel).getByLabelText('Telefone de contacto')).toHaveValue('253123456');
    expect(within(panel).getByRole('button', { name: 'Guardar alterações' })).toBeInTheDocument();
    expect(within(panel).queryByRole('button', { name: /NIF/ })).not.toBeInTheDocument();
  });

  it('gravar chama updateRegistration com o NIF igual ao registado e mostra «Dados guardados»', async () => {
    companyService.updateRegistration.mockResolvedValue(companyStatus({ status: 'APPROVED' }));
    await openDataTab();

    fireEvent.change(screen.getByLabelText('Telefone de contacto'), {
      target: { value: '253999888' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar alterações' }));

    expect(await screen.findByText('Dados guardados')).toBeInTheDocument();
    expect(companyService.updateRegistration).toHaveBeenCalledWith(
      expect.objectContaining({ taxId: '123456789', contactPhone: '253999888' }),
    );
    expect(screen.getByText('Aprovada')).toBeInTheDocument();
  });

  it('o erro ERR-10 aparece junto do campo', async () => {
    companyService.updateRegistration.mockRejectedValue(
      new ApiError(400, 'Dados inválidos.', 'ERR-10', [
        { field: 'contactPhone', reason: 'O telefone não é válido.' },
      ]),
    );
    await openDataTab();

    fireEvent.click(screen.getByRole('button', { name: 'Guardar alterações' }));

    const field = screen.getByLabelText('Telefone de contacto');
    await waitFor(() => expect(field).toHaveAccessibleDescription('O telefone não é válido.'));
    expect(screen.queryByText('Dados guardados')).not.toBeInTheDocument();
  });

  it('o duplo clique em «Guardar alterações» não envia dois pedidos', async () => {
    companyService.updateRegistration.mockReturnValue(new Promise(() => undefined));
    await openDataTab();
    const form = screen
      .getByRole('button', { name: 'Guardar alterações' })
      .closest('form') as HTMLFormElement;

    fireEvent.submit(form);
    fireEvent.submit(form);

    expect(companyService.updateRegistration).toHaveBeenCalledTimes(1);
  });

  it('sem dados de registo avisa que não estão disponíveis', async () => {
    companyService.getRegistration.mockResolvedValue(null);
    await openPage();
    fireEvent.click(screen.getByRole('tab', { name: 'Dados da Empresa' }));

    expect(screen.getByText('Os dados de registo da Empresa não estão disponíveis.')).toBeVisible();
  });

  it('mudar de separador não perde o que está por gravar na página', async () => {
    await openPage();
    fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'Rascunho' } });

    fireEvent.click(screen.getByRole('tab', { name: 'Dados da Empresa' }));
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Dados da Empresa' }), {
      key: 'ArrowLeft',
    });

    expect(screen.getByLabelText('Descrição')).toHaveValue('Rascunho');
    expect(screen.getByRole('tab', { name: 'Página da Empresa' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });
});

describe('CompanyProfilePage — erros de carregamento', () => {
  it('falha de ligação mostra o alerta e «Tentar de novo» repete os pedidos', async () => {
    const failure = ApiError.connectionFailure();
    companyService.getPage.mockRejectedValueOnce(failure);
    renderPage();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(failure.message);

    companyService.getPage.mockResolvedValue(companyPageDto());
    fireEvent.click(within(alert).getByRole('button', { name: 'Tentar de novo' }));

    await screen.findByRole('tab', { name: 'Página da Empresa' });
    expect(companyService.getPage).toHaveBeenCalledTimes(2);
    expect(companyService.getRegistration).toHaveBeenCalledTimes(2);
    expect(refreshCompanyStatus).not.toHaveBeenCalled();
  });

  it('falha ao ler os dados de registo também mostra o alerta', async () => {
    companyService.getRegistration.mockRejectedValue(ApiError.connectionFailure());
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent(/Não foi possível contactar/);
  });

  it('ERR-07 ao carregar lê o estado da Empresa', async () => {
    companyService.getPage.mockRejectedValue(new ApiError(403, 'Empresa não aprovada.', 'ERR-07'));
    renderPage();

    await screen.findByRole('alert');
    expect(refreshCompanyStatus).toHaveBeenCalledTimes(1);
  });

  it('ERR-07 ao gravar lê o estado da Empresa', async () => {
    companyService.updatePage.mockRejectedValue(
      new ApiError(403, 'Empresa não aprovada.', 'ERR-07'),
    );
    await openPage();

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(refreshCompanyStatus).toHaveBeenCalledTimes(1));
  });

  it('mostra «A carregar…» enquanto os pedidos não respondem', () => {
    companyService.getPage.mockReturnValue(new Promise(() => undefined));
    companyService.getRegistration.mockReturnValue(new Promise(() => undefined));
    renderPage();

    expect(screen.getByText(/A carregar/)).toBeInTheDocument();
  });
});
