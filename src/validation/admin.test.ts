import {
  addDays,
  periodDays,
  periodError,
  referenceNameError,
  rejectionReasonError,
} from './admin';

// I074 — período dos indicadores.
describe('periodError', () => {
  const today = '2026-11-13';

  it('aceita um período válido, um só dia e a data final igual a hoje', () => {
    expect(periodError('2026-10-01', '2026-10-31', today)).toBeNull();
    expect(periodError('2026-10-05', '2026-10-05', today)).toBeNull();
    expect(periodError('2026-11-01', '2026-11-13', today)).toBeNull();
  });

  it('rejeita a data inicial posterior à final (A02c)', () => {
    expect(periodError('2026-10-31', '2026-10-01', today)).toBe(
      'A data inicial tem de ser anterior ou igual à data final.',
    );
  });

  it('rejeita a data final futura', () => {
    expect(periodError('2026-11-01', '2026-11-14', today)).toBe(
      'A data final não pode ser posterior à data de hoje.',
    );
  });

  it.each([
    ['', '2026-10-31'],
    ['2026-10-01', ''],
    ['01/10/2026', '2026-10-31'],
    ['2026-10-01', '2026-1-31'],
    ['2026-02-30', '2026-03-05'],
    ['2026-10-01', '2026-13-01'],
  ])('rejeita datas em falta ou mal formadas (%s, %s)', (from, to) => {
    expect(periodError(from, to, today)).toBe('Indique a data inicial e a data final.');
  });
});

describe('periodDays', () => {
  it('conta os dias de forma inclusiva', () => {
    expect(periodDays('2026-10-05', '2026-10-05')).toBe(1);
    expect(periodDays('2026-10-01', '2026-10-31')).toBe(31);
    expect(periodDays('2026-10-15', '2026-10-16')).toBe(2);
  });

  it('não é afetado pela mudança de hora de outubro (25 de outubro de 2026)', () => {
    expect(periodDays('2026-10-24', '2026-10-26')).toBe(3);
    expect(periodDays('2026-10-25', '2026-10-25')).toBe(1);
    expect(periodDays('2026-10-01', '2026-11-01')).toBe(32);
  });

  it('devolve 0 com datas mal formadas', () => {
    expect(periodDays('', '2026-10-01')).toBe(0);
    expect(periodDays('2026-02-30', '2026-03-01')).toBe(0);
  });
});

describe('addDays', () => {
  it('soma e subtrai dias, atravessando meses e a mudança de hora', () => {
    expect(addDays('2026-11-13', -29)).toBe('2026-10-15');
    expect(addDays('2026-10-25', 1)).toBe('2026-10-26');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('devolve a data tal como veio se estiver mal formada', () => {
    expect(addDays('abc', 3)).toBe('abc');
  });
});

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
