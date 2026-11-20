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

  it('prende o Tab dentro do diálogo e devolve o foco a quem o abriu', () => {
    function Page({ open }: Readonly<{ open: boolean }>) {
      return (
        <>
          <button type="button">Abrir</button>
          {open && (
            <ConfirmDialog
              title="Publicar vaga"
              confirmLabel="Publicar"
              onConfirm={jest.fn()}
              onCancel={jest.fn()}
            >
              <p>Efeitos</p>
            </ConfirmDialog>
          )}
        </>
      );
    }
    const { rerender } = render(<Page open={false} />);
    screen.getByRole('button', { name: 'Abrir' }).focus();
    rerender(<Page open />);
    const dialog = screen.getByRole('dialog');
    const confirm = screen.getByRole('button', { name: 'Publicar' });
    const cancel = screen.getByRole('button', { name: 'Cancelar' });

    expect(confirm).toHaveFocus();
    fireEvent.keyDown(dialog, { key: 'a' });
    expect(confirm).toHaveFocus();
    expect(fireEvent.keyDown(dialog, { key: 'Tab' })).toBe(true);
    cancel.focus();
    expect(fireEvent.keyDown(dialog, { key: 'Tab' })).toBe(false);
    expect(confirm).toHaveFocus();
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(cancel).toHaveFocus();

    rerender(<Page open={false} />);
    expect(screen.getByRole('button', { name: 'Abrir' })).toHaveFocus();
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
