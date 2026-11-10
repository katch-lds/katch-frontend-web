import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { companyRegistrationDto, job } from '../../test/fixtures';
import {
  companyService,
  jobService,
  referenceListService,
  resetServiceMocks,
} from '../../test/servicesMock';
import { ApiError } from '../api/ApiError';
import JobFormPage from './JobFormPage';

jest.mock('../services', () => jest.requireActual('../../test/servicesMock'));
jest.mock('../hooks/useProtectedFile', () => ({ useProtectedFile: () => null }));

function JobsDestination() {
  const location = useLocation();
  const state = location.state as { notice?: string } | null;
  return <p data-testid="jobs">{state?.notice}</p>;
}

function renderForm(path = '/vagas/nova') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/vagas" element={<JobsDestination />} />
        <Route path="/vagas/nova" element={<JobFormPage />} />
        <Route path="/vagas/:jobId/editar" element={<JobFormPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function photo(name: string, type: string, size = 1000): File {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

const change = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

async function fillRequiredFields() {
  change(await screen.findByLabelText('Função').then(() => 'Função'), 'Empregado de mesa');
  change('Descrição', 'Serviço de mesa.');
  change('Salário mínimo (€ brutos/mês)', '900');
  change('Salário máximo (€ brutos/mês)', '1100');
  change('Contrato', 'PERMANENT');
  change('Regime', 'ON_SITE');
  fireEvent.click(screen.getByRole('checkbox', { name: 'Atendimento' }));
}

const choosePhotos = (...files: File[]) =>
  fireEvent.change(screen.getByLabelText(/Adicionar fotografia/), { target: { files } });

beforeEach(() => {
  resetServiceMocks();
  referenceListService.listLocations.mockResolvedValue([
    { id: 'loc-1', name: 'Braga (Braga)' },
    { id: 'loc-2', name: 'Porto (Porto)' },
  ]);
  companyService.getRegistration.mockResolvedValue(
    companyRegistrationDto({ locationId: 'loc-2', locationName: 'Porto (Porto)' }),
  );
});

describe('JobFormPage — criação (W10)', () => {
  it('propõe a localidade da Empresa e cria a vaga como não publicada (RF050)', async () => {
    jobService.create.mockResolvedValue(job({ status: 'UNPUBLISHED' }));
    renderForm();

    await fillRequiredFields();
    expect(screen.getByLabelText('Localidade')).toHaveValue('loc-2');
    expect(screen.getByText('A vaga é guardada como não publicada.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Refeição no local' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Marcar como urgente' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByTestId('jobs')).toHaveTextContent(
      'Vaga «Empregado de mesa» criada como não publicada.',
    );
    expect(jobService.create).toHaveBeenCalledWith({
      title: 'Empregado de mesa',
      description: 'Serviço de mesa.',
      minSalary: 900,
      maxSalary: 1100,
      locationId: 'loc-2',
      contractType: 'PERMANENT',
      workMode: 'ON_SITE',
      skillIds: ['skill-1'],
      benefitIds: ['benefit-1'],
      isUrgent: true,
      expiresAt: null,
    });
    expect(jobService.addPhoto).not.toHaveBeenCalled();
  });

  it('sem a localidade da Empresa, a localidade fica por escolher', async () => {
    companyService.getRegistration.mockRejectedValue(ApiError.connectionFailure());
    renderForm();

    expect(await screen.findByLabelText('Localidade')).toHaveValue('');
  });

  it('assinala os campos obrigatórios e não envia o pedido', async () => {
    renderForm();

    fireEvent.click(await screen.findByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('A função é obrigatória.')).toBeInTheDocument();
    expect(screen.getByText('Escolha pelo menos uma competência.')).toBeInTheDocument();
    expect(screen.getByText('O tipo de contrato é obrigatório.')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Corrija os campos indicados');
    expect(jobService.create).not.toHaveBeenCalled();
  });

  it('mostra junto do salário mínimo a recusa do intervalo salarial pela API (RF051)', async () => {
    jobService.create.mockRejectedValue(
      new ApiError(400, 'Os dados não são válidos.', 'ERR-10', [
        { field: 'minSalary', reason: 'O valor mínimo não pode ser superior ao valor máximo.' },
      ]),
    );
    renderForm();

    await fillRequiredFields();
    change('Salário mínimo (€ brutos/mês)', '1500');
    change('Salário máximo (€ brutos/mês)', '1200');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    const message = await screen.findByText(
      'O valor mínimo não pode ser superior ao valor máximo.',
    );
    expect(message).toHaveAttribute('id', 'minSalary-error');
    expect(screen.getByLabelText('Salário mínimo (€ brutos/mês)')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(jobService.create).toHaveBeenCalledWith(
      expect.objectContaining({ minSalary: 1500, maxSalary: 1200 }),
    );
  });

  it('recusa formatos inválidos e fotografias acima de 5 MB e envia as aceites depois de criar (RF052)', async () => {
    jobService.create.mockResolvedValue(job({ jobId: 'job-9', status: 'UNPUBLISHED' }));
    jobService.addPhoto.mockResolvedValue('/api/files/JOB_PHOTO/a.jpg');
    renderForm();

    await fillRequiredFields();
    choosePhotos(
      photo('cartaz.gif', 'image/gif'),
      photo('grande.jpg', 'image/jpeg', 6 * 1024 * 1024),
      photo('sala.png', 'image/png'),
    );

    expect(
      screen.getByText(/cartaz.gif: a fotografia tem de estar no formato JPEG ou PNG/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/grande.jpg: a fotografia pode ter no máximo 5 MB/),
    ).toBeInTheDocument();
    expect(screen.getByText('sala.png')).toBeInTheDocument();
    expect(screen.getByText(/\(1\/5\)/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await screen.findByTestId('jobs');
    expect(jobService.addPhoto).toHaveBeenCalledTimes(1);
    expect(jobService.addPhoto).toHaveBeenCalledWith('job-9', expect.any(File));
    expect(jobService.addPhoto.mock.calls[0][1].name).toBe('sala.png');
  });

  it('não aceita mais de 5 fotografias e permite retirar uma escolhida', async () => {
    renderForm();
    await screen.findByLabelText('Função');

    choosePhotos(...['1', '2', '3', '4', '5', '6'].map((n) => photo(`${n}.jpg`, 'image/jpeg')));

    expect(screen.getByText('6.jpg: a vaga pode ter no máximo 5 fotografias.')).toBeInTheDocument();
    expect(screen.getByLabelText(/Adicionar fotografia/)).toBeDisabled();
    fireEvent.click(screen.getAllByRole('button', { name: 'Retirar' })[0]);
    expect(screen.queryByText('1.jpg')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Adicionar fotografia/)).toBeEnabled();
  });

  it('com uma fotografia recusada pela API, segue para a alteração da vaga já criada', async () => {
    const created = job({ jobId: 'job-9', status: 'UNPUBLISHED' });
    jobService.create.mockResolvedValue(created);
    jobService.list.mockResolvedValue([created]);
    jobService.addPhoto.mockRejectedValue(
      new ApiError(400, 'O ficheiro não é uma imagem JPEG ou PNG válida.', 'ERR-11'),
    );
    renderForm();

    await fillRequiredFields();
    choosePhotos(photo('falsa.jpg', 'image/jpeg'));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('heading', { name: 'Editar vaga' })).toBeInTheDocument();
    expect(
      await screen.findByText('falsa.jpg: O ficheiro não é uma imagem JPEG ou PNG válida.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Função')).toHaveValue('Empregado de mesa');
  });
});

describe('JobFormPage — alteração (W11)', () => {
  it('preenche o formulário com a vaga e grava a alteração (RF054)', async () => {
    jobService.list.mockResolvedValue([
      job({ photoUrls: ['/api/files/JOB_PHOTO/a.jpg', '/api/files/JOB_PHOTO/b.jpg'] }),
    ]);
    jobService.update.mockResolvedValue(job({ maxSalary: 1300 }));
    renderForm('/vagas/job-1/editar');

    expect(await screen.findByLabelText('Função')).toHaveValue('Empregado de mesa');
    expect(screen.getByLabelText('Localidade')).toHaveValue('loc-1');
    expect(screen.getByRole('checkbox', { name: 'Atendimento' })).toBeChecked();
    expect(screen.getByRole('img', { name: 'Fotografia 2 da vaga' })).toBeInTheDocument();
    expect(screen.getByText(/\(2\/5\)/)).toBeInTheDocument();
    expect(companyService.getRegistration).not.toHaveBeenCalled();

    change('Salário máximo (€ brutos/mês)', '1300');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByTestId('jobs')).toHaveTextContent(
      'Vaga «Empregado de mesa» alterada.',
    );
    expect(jobService.update).toHaveBeenCalledWith(
      'job-1',
      expect.objectContaining({ maxSalary: 1300, skillIds: ['skill-1'] }),
    );
  });

  it('na alteração, uma fotografia recusada fica indicada e a vaga é lida de novo', async () => {
    jobService.list.mockResolvedValue([job()]);
    jobService.update.mockResolvedValue(job());
    jobService.addPhoto.mockRejectedValue(
      new ApiError(409, 'A vaga já tem 5 fotografias.', 'ERR-39'),
    );
    renderForm('/vagas/job-1/editar');

    await screen.findByLabelText('Função');
    choosePhotos(photo('sexta.png', 'image/png'));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('sexta.png: A vaga já tem 5 fotografias.')).toBeInTheDocument();
    await waitFor(() => expect(jobService.list).toHaveBeenCalledTimes(2));
    expect(screen.queryByText('sexta.png')).not.toBeInTheDocument();
  });

  it('com 5 fotografias, não deixa escolher outra', async () => {
    const urls = ['a', 'b', 'c', 'd', 'e'].map((n) => `/api/files/JOB_PHOTO/${n}.jpg`);
    jobService.list.mockResolvedValue([job({ photoUrls: urls })]);
    renderForm('/vagas/job-1/editar');

    expect(await screen.findByLabelText(/Adicionar fotografia/)).toBeDisabled();
    expect(screen.getByText(/\(5\/5\)/)).toBeInTheDocument();
  });

  it('não deixa alterar uma vaga encerrada', async () => {
    jobService.list.mockResolvedValue([job({ status: 'CLOSED' })]);
    renderForm('/vagas/job-1/editar');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A vaga «Empregado de mesa» está encerrada e não pode ser alterada.',
    );
    expect(screen.queryByRole('button', { name: 'Guardar' })).not.toBeInTheDocument();
  });

  it('indica a vaga inexistente e volta à lista', async () => {
    renderForm('/vagas/outra/editar');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A vaga não existe ou já foi eliminada.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Voltar às vagas' }));
    expect(screen.getByTestId('jobs')).toBeInTheDocument();
  });

  it('«Cancelar» volta à lista sem gravar', async () => {
    renderForm();

    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));

    expect(screen.getByTestId('jobs')).toBeInTheDocument();
    expect(jobService.create).not.toHaveBeenCalled();
  });
});
