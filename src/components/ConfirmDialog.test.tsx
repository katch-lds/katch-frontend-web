import { fireEvent, render, screen } from '@testing-library/react';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('põe o foco na confirmação e fecha com Escape', () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();
    render(
      <ConfirmDialog
        title="Publicar vaga"
        confirmLabel="Publicar"
        onConfirm={onConfirm}
        onCancel={onCancel}
      >
        <p>Efeitos</p>
      </ConfirmDialog>,
    );

    expect(screen.getByRole('dialog', { name: 'Publicar vaga' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publicar' })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('durante o pedido, desativa os botões e ignora o Escape', () => {
    const onCancel = jest.fn();
    render(
      <ConfirmDialog
        title="Encerrar vaga"
        confirmLabel="Encerrar"
        busy
        onConfirm={jest.fn()}
        onCancel={onCancel}
      >
        <p>Efeitos</p>
      </ConfirmDialog>,
    );

    expect(screen.getByRole('button', { name: 'A enviar…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onCancel).not.toHaveBeenCalled();
  });
});
