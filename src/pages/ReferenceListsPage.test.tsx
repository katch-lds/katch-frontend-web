import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderApp, signedInStore } from '../../test/renderApp';
import { referenceListService, resetServiceMocks } from '../../test/servicesMock';
import { ApiError } from '../api/ApiError';

jest.mock('../services', () => jest.requireActual('../../test/servicesMock'));

const { listSkills, listBenefits, addSkill, renameSkill, addBenefit, renameBenefit } =
  referenceListService;

const duplicate = () =>
  new ApiError(400, 'Os dados enviados não cumprem a validação automática.', 'ERR-10', [
    { field: 'name', reason: 'A designação já existe na lista.' },
  ]);

async function openPage() {
  listSkills.mockResolvedValue([
    { id: 'skill-1', name: 'C#' },
    { id: 'skill-2', name: 'SQL' },
  ]);
  listBenefits.mockResolvedValue([{ id: 'benefit-1', name: 'Seguro de saúde' }]);
  renderApp('/admin/listas', signedInStore('ADMIN'));
  await screen.findByText('Seguro de saúde');
}

const skills = () => screen.getByRole('region', { name: 'Competências' });
const benefits = () => screen.getByRole('region', { name: 'Benefícios' });

beforeEach(() => resetServiceMocks());

describe('ReferenceListsPage (A09)', () => {
  it('mostra as competências e os benefícios, e não as localidades', async () => {
    await openPage();

    expect(within(skills()).getByText('C#')).toBeInTheDocument();
    expect(within(skills()).getByText('SQL')).toBeInTheDocument();
    expect(within(benefits()).getByText('Seguro de saúde')).toBeInTheDocument();
    expect(screen.queryByText(/localidades/i)).not.toBeInTheDocument();
    expect(referenceListService.listLocations).not.toHaveBeenCalled();
  });

  it('acrescenta uma competência, mostra a mensagem e lê as listas de novo', async () => {
    addSkill.mockResolvedValue({ id: 'skill-3', name: 'Kubernetes' });
    await openPage();
    listSkills.mockResolvedValue([
      { id: 'skill-1', name: 'C#' },
      { id: 'skill-3', name: 'Kubernetes' },
    ]);

    fireEvent.change(within(skills()).getByLabelText('Nova competência'), {
      target: { value: '  Kubernetes ' },
    });
    fireEvent.click(within(skills()).getByRole('button', { name: 'Acrescentar' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Competência «Kubernetes» acrescentada.',
    );
    expect(addSkill).toHaveBeenCalledWith({ name: 'Kubernetes' });
    expect(await within(skills()).findByText('Kubernetes')).toBeInTheDocument();
    expect(within(skills()).getByLabelText('Nova competência')).toHaveValue('');
    expect(listSkills).toHaveBeenCalledTimes(2);
  });

  it('acrescenta um benefício', async () => {
    addBenefit.mockResolvedValue({ id: 'benefit-2', name: 'Horário flexível' });
    await openPage();

    fireEvent.change(within(benefits()).getByLabelText('Novo benefício'), {
      target: { value: 'Horário flexível' },
    });
    fireEvent.click(within(benefits()).getByRole('button', { name: 'Acrescentar' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Benefício «Horário flexível» acrescentado.',
    );
    expect(addBenefit).toHaveBeenCalledWith({ name: 'Horário flexível' });
    await waitFor(() => expect(listBenefits).toHaveBeenCalledTimes(2));
  });

  it.each([
    ['vazia', ''],
    ['só com espaços', '    '],
  ])('rejeita no cliente a designação %s, sem pedido', async (_, value) => {
    await openPage();

    fireEvent.change(within(skills()).getByLabelText('Nova competência'), { target: { value } });
    fireEvent.click(within(skills()).getByRole('button', { name: 'Acrescentar' }));

    expect(await within(skills()).findByText('A designação é obrigatória.')).toBeInTheDocument();
    expect(within(skills()).getByLabelText('Nova competência')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(addSkill).not.toHaveBeenCalled();
  });

  it('mostra o motivo do servidor para a designação repetida (A09b), sem alterar a lista', async () => {
    addSkill.mockRejectedValue(duplicate());
    await openPage();

    fireEvent.change(within(skills()).getByLabelText('Nova competência'), {
      target: { value: 'c#' },
    });
    fireEvent.click(within(skills()).getByRole('button', { name: 'Acrescentar' }));

    expect(
      await within(skills()).findByText('A designação já existe na lista.'),
    ).toBeInTheDocument();
    expect(within(skills()).getByLabelText('Nova competência')).toHaveValue('c#');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(listSkills).toHaveBeenCalledTimes(1);
  });

  it('altera a designação de uma competência na própria lista', async () => {
    renameSkill.mockResolvedValue({ id: 'skill-2', name: 'SQL Server' });
    await openPage();

    fireEvent.click(within(skills()).getByRole('button', { name: 'Alterar designação de SQL' }));
    fireEvent.change(within(skills()).getByLabelText('Nova designação de SQL'), {
      target: { value: 'SQL Server' },
    });
    fireEvent.click(within(skills()).getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Competência alterada para «SQL Server».',
    );
    expect(renameSkill).toHaveBeenCalledWith('skill-2', { name: 'SQL Server' });
    await waitFor(() => expect(listSkills).toHaveBeenCalledTimes(2));
    expect(within(skills()).queryByLabelText('Nova designação de SQL')).not.toBeInTheDocument();
  });

  it('altera a designação de um benefício', async () => {
    renameBenefit.mockResolvedValue({ id: 'benefit-1', name: 'Seguro de saúde familiar' });
    await openPage();

    fireEvent.click(
      within(benefits()).getByRole('button', { name: 'Alterar designação de Seguro de saúde' }),
    );
    fireEvent.change(within(benefits()).getByLabelText('Nova designação de Seguro de saúde'), {
      target: { value: 'Seguro de saúde familiar' },
    });
    fireEvent.click(within(benefits()).getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Benefício alterado para «Seguro de saúde familiar».',
    );
    expect(renameBenefit).toHaveBeenCalledWith('benefit-1', { name: 'Seguro de saúde familiar' });
  });

  it('rejeita a alteração para designação vazia e mostra a repetida do servidor', async () => {
    renameSkill.mockRejectedValue(duplicate());
    await openPage();
    fireEvent.click(within(skills()).getByRole('button', { name: 'Alterar designação de SQL' }));
    const field = within(skills()).getByLabelText('Nova designação de SQL');

    fireEvent.change(field, { target: { value: ' ' } });
    fireEvent.click(within(skills()).getByRole('button', { name: 'Guardar' }));
    expect(await within(skills()).findByText('A designação é obrigatória.')).toBeInTheDocument();
    expect(renameSkill).not.toHaveBeenCalled();

    fireEvent.change(field, { target: { value: 'c#' } });
    fireEvent.click(within(skills()).getByRole('button', { name: 'Guardar' }));
    expect(
      await within(skills()).findByText('A designação já existe na lista.'),
    ).toBeInTheDocument();
    expect(renameSkill).toHaveBeenCalledWith('skill-2', { name: 'c#' });
  });

  it('«Cancelar» fecha a alteração sem pedido', async () => {
    await openPage();

    fireEvent.click(within(skills()).getByRole('button', { name: 'Alterar designação de SQL' }));
    fireEvent.click(within(skills()).getByRole('button', { name: 'Cancelar' }));

    expect(within(skills()).queryByLabelText('Nova designação de SQL')).not.toBeInTheDocument();
    expect(renameSkill).not.toHaveBeenCalled();
  });

  it('uma falha de ligação ao acrescentar mostra o aviso com «Tentar de novo»', async () => {
    addSkill.mockRejectedValue(ApiError.connectionFailure());
    await openPage();

    fireEvent.change(within(skills()).getByLabelText('Nova competência'), {
      target: { value: 'Docker' },
    });
    fireEvent.click(within(skills()).getByRole('button', { name: 'Acrescentar' }));

    const alert = await within(skills()).findByRole('alert');
    expect(alert).toHaveTextContent('Não foi possível contactar o servidor');
    addSkill.mockResolvedValue({ id: 'skill-4', name: 'Docker' });
    fireEvent.click(within(alert).getByRole('button', { name: 'Tentar de novo' }));

    await waitFor(() => expect(addSkill).toHaveBeenCalledTimes(2));
  });

  it('sem competências nem benefícios mostra as mensagens de lista vazia', async () => {
    listSkills.mockResolvedValue([]);
    listBenefits.mockResolvedValue([]);
    renderApp('/admin/listas', signedInStore('ADMIN'));

    expect(await screen.findByText('Ainda não há competências.')).toBeInTheDocument();
    expect(screen.getByText('Ainda não há benefícios.')).toBeInTheDocument();
  });

  it('falha de ligação ao abrir: aviso e «Tentar de novo»', async () => {
    listSkills.mockRejectedValueOnce(ApiError.connectionFailure());
    renderApp('/admin/listas', signedInStore('ADMIN'));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível contactar o servidor',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByText('Atendimento')).toBeInTheDocument();
  });

  it('mostra o estado de carregamento', () => {
    listSkills.mockReturnValue(new Promise(() => undefined));
    renderApp('/admin/listas', signedInStore('ADMIN'));

    expect(screen.getByText('A carregar as listas…')).toBeInTheDocument();
  });
});
