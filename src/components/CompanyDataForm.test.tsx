import { fireEvent, render, screen } from '@testing-library/react';
import { companyRegistrationDto } from '../../test/fixtures';
import { resetServiceMocks } from '../../test/servicesMock';
import { companyFormFrom } from '../validation/forms';
import { CompanyDataForm } from './CompanyDataForm';

jest.mock('../services', () => jest.requireActual('../../test/servicesMock'));

beforeEach(() => resetServiceMocks());

const initialValues = companyFormFrom(companyRegistrationDto());

describe('CompanyDataForm — NIF bloqueado (I121)', () => {
  it('com taxIdLocked o NIF fica só de leitura, com a nota', async () => {
    render(
      <CompanyDataForm
        initialValues={initialValues}
        submitLabel="Guardar alterações"
        taxIdLocked
        onSubmit={jest.fn()}
      />,
    );

    expect(screen.getByLabelText('NIF')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('NIF')).toHaveValue('123456789');
    expect(
      screen.getByText('O NIF não pode ser alterado depois da aprovação.'),
    ).toBeInTheDocument();
    await screen.findByRole('option', { name: 'Braga (Braga)' });
  });

  it('sem a propriedade o NIF continua editável e sem nota', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(
      <CompanyDataForm initialValues={initialValues} submitLabel="Submeter" onSubmit={onSubmit} />,
    );
    await screen.findByRole('option', { name: 'Braga (Braga)' });

    expect(screen.getByLabelText('NIF')).not.toHaveAttribute('readonly');
    expect(screen.queryByText(/não pode ser alterado/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('NIF'), { target: { value: '987654321' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submeter' }));

    await screen.findByRole('button', { name: 'Submeter' });
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ taxId: '987654321' }));
  });
});
