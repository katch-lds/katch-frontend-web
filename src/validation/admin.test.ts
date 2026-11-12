import { referenceNameError, rejectionReasonError } from './admin';

describe('rejectionReasonError (P12: 10 a 500 caracteres)', () => {
  it.each([
    [9, true],
    [10, false],
    [11, false],
    [499, false],
    [500, false],
    [501, true],
  ])('motivo com %i caracteres: rejeitado=%s', (length, rejected) => {
    expect(rejectionReasonError('a'.repeat(length)) !== null).toBe(rejected);
  });

  it('a mensagem diz o intervalo permitido', () => {
    expect(rejectionReasonError('curto')).toBe('O motivo tem de ter entre 10 e 500 caracteres.');
  });

  it('os espaços no início e no fim não contam', () => {
    expect(rejectionReasonError(`  ${'a'.repeat(9)}  `)).not.toBeNull();
    expect(rejectionReasonError(`  ${'a'.repeat(10)}  `)).toBeNull();
    expect(rejectionReasonError(' '.repeat(20))).not.toBeNull();
  });
});

describe('referenceNameError', () => {
  it('rejeita a designação vazia ou só com espaços', () => {
    expect(referenceNameError('')).toBe('A designação é obrigatória.');
    expect(referenceNameError('   ')).toBe('A designação é obrigatória.');
  });

  it('aceita até 100 caracteres e rejeita 101', () => {
    expect(referenceNameError('a'.repeat(100))).toBeNull();
    expect(referenceNameError('a'.repeat(101))).toBe(
      'A designação pode ter no máximo 100 caracteres.',
    );
  });
});
