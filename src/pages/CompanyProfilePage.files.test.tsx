import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { companyPageDto, companyStatus } from '../../test/fixtures';
import { companyService, resetServiceMocks } from '../../test/servicesMock';
import { SessionContext, type SessionState } from '../session/SessionProvider';
import CompanyProfilePage from './CompanyProfilePage';

jest.mock('../services', () => jest.requireActual('../../test/servicesMock'));
// Aqui o useProtectedFile é o verdadeiro: o que se verifica são os ficheiros pedidos ao servidor.
const mockGetFile = jest.fn();
jest.mock('../api', () => ({ apiClient: { getFile: (path: string) => mockGetFile(path) } }));

const OLD_LOGO = '/api/files/COMPANY_LOGO/antigo.png';
const NEW_LOGO = '/api/files/COMPANY_LOGO/novo.png';

function renderPage() {
  const session: SessionState = {
    session: null,
    companyStatus: companyStatus({ status: 'APPROVED' }),
    companyLoaded: true,
    companyError: null,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    refreshCompanyStatus: jest.fn(),
  };
  render(
    <MemoryRouter>
      <SessionContext.Provider value={session}>
        <CompanyProfilePage />
      </SessionContext.Provider>
    </MemoryRouter>,
  );
}

const png = () => new File(['x'], 'imagem.png', { type: 'image/png' });

beforeEach(() => {
  resetServiceMocks();
  mockGetFile.mockReset();
  mockGetFile.mockResolvedValue(new Blob(['x'], { type: 'image/png' }));
  URL.createObjectURL = jest.fn(() => 'blob:imagem');
  URL.revokeObjectURL = jest.fn();
});

describe('CompanyProfilePage — ficheiros pedidos depois de uma troca', () => {
  it('depois de substituir o logótipo só se pede o ficheiro novo, nunca o antigo outra vez', async () => {
    companyService.getPage.mockResolvedValue(companyPageDto({ logoUrl: OLD_LOGO }));
    companyService.uploadLogo.mockResolvedValue(NEW_LOGO);
    renderPage();
    await screen.findByRole('tab', { name: 'Página da Empresa' });
    await waitFor(() => expect(mockGetFile).toHaveBeenCalledWith(OLD_LOGO));
    companyService.getPage.mockResolvedValue(companyPageDto({ logoUrl: NEW_LOGO }));

    fireEvent.change(screen.getByLabelText('Escolher'), { target: { files: [png()] } });

    await waitFor(() => expect(mockGetFile).toHaveBeenCalledWith(NEW_LOGO));
    expect(mockGetFile.mock.calls.map(([path]) => path)).toEqual([OLD_LOGO, NEW_LOGO]);
  });

  it('depois de acrescentar uma fotografia só se pede o ficheiro novo', async () => {
    const existing = ['/api/files/COMPANY_PHOTO/1.jpg', '/api/files/COMPANY_PHOTO/2.jpg'];
    const added = '/api/files/COMPANY_PHOTO/3.jpg';
    companyService.getPage.mockResolvedValue(companyPageDto({ photoUrls: existing }));
    companyService.addGalleryPhoto.mockResolvedValue(added);
    renderPage();
    await screen.findByRole('tab', { name: 'Página da Empresa' });
    await waitFor(() => expect(mockGetFile).toHaveBeenCalledTimes(2));
    companyService.getPage.mockResolvedValue(companyPageDto({ photoUrls: [...existing, added] }));

    fireEvent.change(screen.getByLabelText('Adicionar fotografia'), {
      target: { files: [png()] },
    });

    await waitFor(() => expect(mockGetFile).toHaveBeenCalledWith(added));
    expect(mockGetFile.mock.calls.map(([path]) => path)).toEqual([...existing, added]);
  });
});
