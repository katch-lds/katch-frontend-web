import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { job } from '../../test/fixtures';
import { jobService, resetServiceMocks } from '../../test/servicesMock';
import { ApiError } from '../api/ApiError';
import JobListPage from './JobListPage';

jest.mock('../services', () => jest.requireActual('../../test/servicesMock'));

function CurrentLocation() {
  const location = useLocation();
  return <p data-testid="location">{location.pathname}</p>;
}

function renderPage(state?: unknown) {
  render(
    <MemoryRouter initialEntries={[{ pathname: '/vagas', state }]}>
      <Routes>
        <Route path="/vagas" element={<JobListPage />} />
        <Route path="*" element={<CurrentLocation />} />
      </Routes>
    </MemoryRouter>,
  );
}

const published = job({ waitingCandidates: 3 });
const unpublished = job({
  jobId: 'job-2',
  title: 'Ajudante de cozinha',
  status: 'UNPUBLISHED',
  expiresAt: null,
  publishedAt: null,
  isUrgent: true,
});
const suspended = job({ jobId: 'job-3', title: 'Rececionista', status: 'SUSPENDED' });
const closed = job({ jobId: 'job-4', title: 'Assistente de loja', status: 'CLOSED' });

async function rowOf(title: string) {
  const cell = await screen.findByText(title);
  return within(cell.closest('tr') as HTMLElement);
}

beforeEach(() => resetServiceMocks());

describe('JobListPage', () => {
  it('lista só as vagas devolvidas para a Empresa, com estado, candidatos em espera e data-limite', async () => {
    jobService.list.mockResolvedValue([published, unpublished, suspended, closed]);
    renderPage();

    const rows = await screen.findAllByRole('row');
    expect(rows).toHaveLength(5);
    const first = within(rows[1]);
    expect(first.getByText('Empregado de mesa')).toBeInTheDocument();
    expect(first.getByText('Publicada')).toBeInTheDocument();
    expect(first.getByText('3')).toBeInTheDocument();
    expect(first.getByText('30/11/2026')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Urgente')).toBeInTheDocument();
    expect(jobService.list).toHaveBeenCalledTimes(1);
  });

  it('mostra as ações de cada estado e nenhuma na vaga encerrada', async () => {
    jobService.list.mockResolvedValue([published, unpublished, suspended, closed]);
    renderPage();

    const names = async (title: string) =>
      (await rowOf(title)).queryAllByRole('button').map((button) => button.textContent);

    expect(await names('Empregado de mesa')).toEqual([
      'Editar',
      'Suspender',
      'Encerrar',
      'Eliminar',
    ]);
    expect(await names('Ajudante de cozinha')).toEqual(['Editar', 'Publicar', 'Eliminar']);
    expect(await names('Rececionista')).toEqual(['Editar', 'Voltar a publicar', 'Encerrar']);
    expect(await names('Assistente de loja')).toEqual([]);
    expect((await rowOf('Assistente de loja')).getByText('sem ações')).toBeInTheDocument();
  });

  it.each([
    ['Ajudante de cozinha', 'Publicar', 'publish', 'job-2', 'publicada'],
    ['Empregado de mesa', 'Suspender', 'suspend', 'job-1', 'suspensa'],
    ['Rececionista', 'Voltar a publicar', 'republish', 'job-3', 'publicada de novo'],
    ['Empregado de mesa', 'Encerrar', 'close', 'job-1', 'encerrada'],
  ] as const)(
    '%s: «%s» pede confirmação, muda o estado e lê de novo a lista',
    async (title, label, operation, jobId, done) => {
      jobService.list.mockResolvedValue([published, unpublished, suspended]);
      jobService[operation].mockResolvedValue(job());
      renderPage();

      fireEvent.click((await rowOf(title)).getByRole('button', { name: label }));
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent(`Vaga: ${title}.`);
      fireEvent.click(within(dialog).getByRole('button', { name: label }));

      expect(await screen.findByRole('status')).toHaveTextContent(`Vaga «${title}» ${done}.`);
      expect(jobService[operation]).toHaveBeenCalledWith(jobId);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(jobService.list).toHaveBeenCalledTimes(2);
    },
  );

  it('cancelar a confirmação não faz o pedido', async () => {
    jobService.list.mockResolvedValue([unpublished]);
    renderPage();

    fireEvent.click((await rowOf('Ajudante de cozinha')).getByRole('button', { name: 'Publicar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(jobService.publish).not.toHaveBeenCalled();
  });

  it('elimina a vaga sem interesses (RF114)', async () => {
    jobService.list.mockResolvedValueOnce([unpublished]).mockResolvedValueOnce([]);
    jobService.delete.mockResolvedValue(undefined);
    renderPage();

    fireEvent.click((await rowOf('Ajudante de cozinha')).getByRole('button', { name: 'Eliminar' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }));

    expect(await screen.findByText(/Ainda não criou vagas/)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Vaga «Ajudante de cozinha» eliminada.');
    expect(jobService.delete).toHaveBeenCalledWith('job-2');
  });

  it('com interesses registados, a eliminação é recusada e propõe encerrar a vaga (RF058, W15)', async () => {
    jobService.list.mockResolvedValue([published]);
    jobService.delete.mockRejectedValue(
      new ApiError(409, 'A vaga tem interesses registados e só pode ser encerrada.', 'ERR-38'),
    );
    jobService.close.mockResolvedValue(job({ status: 'CLOSED' }));
    renderPage();

    fireEvent.click((await rowOf('Empregado de mesa')).getByRole('button', { name: 'Eliminar' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }));

    const blocked = await screen.findByRole('dialog', { name: 'Não é possível eliminar a vaga' });
    expect(blocked).toHaveTextContent('A vaga tem interesses registados e só pode ser encerrada.');
    fireEvent.click(within(blocked).getByRole('button', { name: 'Encerrar vaga' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Vaga «Empregado de mesa» encerrada.',
    );
    expect(jobService.close).toHaveBeenCalledWith('job-1');
  });

  it('com interesses registados, «Voltar» fecha o diálogo sem encerrar', async () => {
    jobService.list.mockResolvedValue([published]);
    jobService.delete.mockRejectedValue(new ApiError(409, 'Só pode ser encerrada.', 'ERR-38'));
    renderPage();

    fireEvent.click((await rowOf('Empregado de mesa')).getByRole('button', { name: 'Eliminar' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Voltar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(jobService.close).not.toHaveBeenCalled();
  });

  it('uma transição já não possível (ERR-30) mostra a mensagem e lê de novo a lista', async () => {
    jobService.list.mockResolvedValue([unpublished]);
    jobService.publish.mockRejectedValue(
      new ApiError(409, 'A operação não é possível no estado atual.', 'ERR-30'),
    );
    renderPage();

    fireEvent.click((await rowOf('Ajudante de cozinha')).getByRole('button', { name: 'Publicar' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Publicar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A operação não é possível no estado atual.',
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(jobService.list).toHaveBeenCalledTimes(2);
  });

  it('abre a criação e a alteração da vaga', async () => {
    jobService.list.mockResolvedValue([published]);
    renderPage();

    fireEvent.click((await rowOf('Empregado de mesa')).getByRole('button', { name: 'Editar' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/vagas/job-1/editar');
  });

  it('«Nova vaga» abre o formulário de criação', async () => {
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Nova vaga' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/vagas/nova');
  });

  it('mostra o aviso deixado pelo formulário e a recusa do servidor com «Tentar de novo»', async () => {
    jobService.list
      .mockRejectedValueOnce(new ApiError(403, 'A Empresa não está aprovada.', 'ERR-07'))
      .mockResolvedValueOnce([published]);
    renderPage({ notice: 'Vaga «Empregado de mesa» criada como não publicada.' });

    expect(screen.getByRole('status')).toHaveTextContent('criada como não publicada');
    expect(await screen.findByRole('alert')).toHaveTextContent('A Empresa não está aprovada.');
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByText('Empregado de mesa')).toBeInTheDocument();
  });
});
