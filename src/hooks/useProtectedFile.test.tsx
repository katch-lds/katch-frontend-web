import { render, screen, waitFor } from '@testing-library/react';
import { apiClient } from '../api';
import { ProtectedImage } from '../components/ProtectedImage';

jest.mock('../api', () => ({ apiClient: { getFile: jest.fn() } }));

const getFile = jest.mocked(apiClient.getFile);

beforeEach(() => {
  getFile.mockReset();
  URL.createObjectURL = jest.fn(() => 'blob:local-1');
  URL.revokeObjectURL = jest.fn();
});

describe('ProtectedImage e useProtectedFile', () => {
  it('obtém o ficheiro com a credencial e revoga o endereço local ao desmontar', async () => {
    getFile.mockResolvedValue(new Blob(['x'], { type: 'image/jpeg' }));
    const { unmount } = render(
      <ProtectedImage url="/api/files/JOB_PHOTO/a.jpg" alt="Fotografia 1" />,
    );

    await waitFor(() =>
      expect(screen.getByRole('img', { name: 'Fotografia 1' })).toHaveAttribute(
        'src',
        'blob:local-1',
      ),
    );
    expect(getFile).toHaveBeenCalledWith('/api/files/JOB_PHOTO/a.jpg');
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:local-1');
  });

  it('sem ficheiro (404) ou sem endereço, mostra o marcador vazio', async () => {
    getFile.mockRejectedValue(new Error('404'));
    render(<ProtectedImage url="/api/files/JOB_PHOTO/x.jpg" alt="Fotografia 1" />);
    render(<ProtectedImage url={null} alt="Fotografia 2" />);

    await waitFor(() => expect(getFile).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('img', { name: 'Fotografia 1' })).toHaveTextContent('Fotografia');
    expect(screen.getByRole('img', { name: 'Fotografia 2' })).toHaveTextContent('Fotografia');
  });
});
