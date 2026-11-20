import { addDays, formatIsoDate, localDate, periodDays } from './date';

describe('localDate', () => {
  it('usa a data local', () => {
    expect(localDate(new Date(2026, 10, 6, 12, 0, 0))).toBe('2026-11-06');
  });
});

describe('formatIsoDate', () => {
  it('passa `aaaa-MM-dd` a `dd/mm/aaaa`', () => {
    expect(formatIsoDate('2026-10-05')).toBe('05/10/2026');
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
