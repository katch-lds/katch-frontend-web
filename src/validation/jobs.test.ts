import { job } from '../../test/fixtures';
import {
  EMPTY_JOB_FORM,
  expiresAtInstant,
  type JobForm,
  listFieldError,
  parseEuros,
  photoError,
  toJobForm,
  toJobRequest,
  todayLocal,
  validateJob,
} from './jobs';

const NOW = new Date(2026, 10, 6, 12, 0, 0);

function validForm(overrides: Partial<JobForm> = {}): JobForm {
  return {
    title: 'Empregado de mesa',
    description: 'Serviço de mesa e apoio ao balcão.',
    minSalary: '900',
    maxSalary: '1100,50',
    locationId: 'loc-1',
    contractType: 'PERMANENT',
    workMode: 'ON_SITE',
    skillIds: ['skill-1'],
    benefitIds: [],
    isUrgent: false,
    expiresAt: '',
    ...overrides,
  };
}

describe('validateJob', () => {
  it('aceita a vaga com os sete campos obrigatórios (RF050)', () => {
    expect(validateJob(validForm(), NOW)).toEqual({});
  });

  it('assinala os campos obrigatórios vazios, incluindo as competências', () => {
    expect(Object.keys(validateJob(EMPTY_JOB_FORM, NOW)).sort()).toEqual([
      'contractType',
      'description',
      'locationId',
      'maxSalary',
      'minSalary',
      'skillIds',
      'title',
      'workMode',
    ]);
    expect(validateJob(validForm({ skillIds: [] }), NOW).skillIds).toBe(
      'Escolha pelo menos uma competência.',
    );
  });

  it.each([
    ['zero', '0', 'O valor tem de ser um número positivo em euros.'],
    ['texto', 'mil', 'O valor tem de ser um número positivo em euros.'],
    ['negativo', '-5', 'O valor tem de ser um número positivo em euros.'],
    ['três casas decimais', '10.123', 'O valor tem de ter no máximo 2 casas decimais.'],
    ['acima do máximo', '100000000', 'O valor não pode exceder 99 999 999,99 euros.'],
  ])('rejeita o salário %s', (_name, value, message) => {
    expect(validateJob(validForm({ minSalary: value }), NOW).minSalary).toBe(message);
  });

  it('deixa a verificação do intervalo salarial para a API (RF051)', () => {
    expect(validateJob(validForm({ minSalary: '1500', maxSalary: '1200' }), NOW)).toEqual({});
  });

  it('rejeita a função e a descrição demasiado longas', () => {
    const errors = validateJob(
      validForm({ title: 'x'.repeat(151), description: 'x'.repeat(5001) }),
      NOW,
    );

    expect(errors.title).toBe('A função pode ter no máximo 150 caracteres.');
    expect(errors.description).toBe('A descrição pode ter no máximo 5000 caracteres.');
  });

  it('rejeita a data-limite no passado e aceita a de hoje', () => {
    expect(validateJob(validForm({ expiresAt: '2026-11-05' }), NOW).expiresAt).toBe(
      'A data-limite tem de ser posterior ao momento atual.',
    );
    expect(validateJob(validForm({ expiresAt: '2026-11-06' }), NOW)).toEqual({});
  });
});

describe('conversões', () => {
  it('parseEuros aceita ponto e vírgula decimais', () => {
    expect(parseEuros(' 1200,5 ')).toBe(1200.5);
    expect(parseEuros('1200.50')).toBe(1200.5);
    expect(parseEuros('1.200,50')).toBeNull();
  });

  it('toJobRequest apara o texto, converte os valores e a data-limite', () => {
    const request = toJobRequest(
      validForm({ title: '  Empregado de mesa ', expiresAt: '2026-11-30', isUrgent: true }),
    );

    expect(request).toMatchObject({
      title: 'Empregado de mesa',
      minSalary: 900,
      maxSalary: 1100.5,
      isUrgent: true,
      expiresAt: expiresAtInstant('2026-11-30'),
    });
    expect(toJobRequest(validForm()).expiresAt).toBeNull();
  });

  it('toJobForm preenche o formulário de alteração a partir da vaga', () => {
    const form = toJobForm(job({ expiresAt: expiresAtInstant('2026-11-30') }));

    expect(form).toMatchObject({
      title: 'Empregado de mesa',
      minSalary: '900',
      skillIds: ['skill-1'],
      benefitIds: ['benefit-1'],
      expiresAt: '2026-11-30',
    });
    expect(toJobForm(job({ expiresAt: null })).expiresAt).toBe('');
  });

  it('todayLocal usa a data local', () => {
    expect(todayLocal(NOW)).toBe('2026-11-06');
  });
});

describe('photoError', () => {
  const file = (name: string, type: string, size: number) => {
    const photo = new File(['x'], name, { type });
    Object.defineProperty(photo, 'size', { value: size });
    return photo;
  };

  it('aceita JPEG e PNG até 5 MB (RF052)', () => {
    expect(photoError(file('a.jpg', 'image/jpeg', 5 * 1024 * 1024))).toBeNull();
    expect(photoError(file('b.png', 'image/png', 1000))).toBeNull();
  });

  it('rejeita outros formatos e ficheiros acima de 5 MB', () => {
    expect(photoError(file('c.gif', 'image/gif', 1000))).toBe(
      'c.gif: a fotografia tem de estar no formato JPEG ou PNG.',
    );
    expect(photoError(file('d.jpg', 'image/jpeg', 6 * 1024 * 1024))).toBe(
      'd.jpg: a fotografia pode ter no máximo 5 MB.',
    );
  });
});

describe('listFieldError', () => {
  it('encontra o erro do campo ou de um elemento da lista', () => {
    expect(listFieldError({ skillIds: 'a' }, 'skillIds')).toBe('a');
    expect(listFieldError({ 'skillIds[1]': 'b' }, 'skillIds')).toBe('b');
    expect(listFieldError({}, 'skillIds')).toBeUndefined();
  });
});
