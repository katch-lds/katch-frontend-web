import {
  collectErrors,
  digitsError,
  emailError,
  hasErrors,
  hasLetterAndDigit,
  isDigits,
  isValidEmailFormat,
  passwordPolicyError,
  requiredText,
} from './fields';

describe('isValidEmailFormat', () => {
  it.each(['ana@exemplo.pt', 'a.b+c@sub.exemplo.com'])('aceita %s', (value) => {
    expect(isValidEmailFormat(value)).toBe(true);
  });

  it.each([
    ['sem @', 'ana.exemplo.pt'],
    ['sem texto antes da @', '@exemplo.pt'],
    ['sem texto depois da @', 'ana@'],
    ['duas @', 'ana@@exemplo.pt'],
    ['outra @ no domínio', 'ana@exe@mplo.pt'],
    ['sem ponto no domínio', 'ana@exemplo'],
    ['ponto no início do domínio', 'ana@.pt'],
    ['ponto no fim do domínio', 'ana@exemplo.'],
    ['espaço', 'ana @exemplo.pt'],
  ])('rejeita %s', (_name, value) => {
    expect(isValidEmailFormat(value)).toBe(false);
  });
});

describe('emailError', () => {
  it('exige o campo, o formato e o limite de 255 caracteres', () => {
    expect(emailError('  ')).toBe('O e-mail é obrigatório.');
    expect(emailError('ana')).toBe('O e-mail não tem um formato válido.');
    expect(emailError(`${'a'.repeat(250)}@b.pt`)).toBe(
      'O e-mail pode ter no máximo 255 caracteres.',
    );
    expect(emailError('ana@exemplo.pt')).toBeNull();
  });

  it('usa o nome do campo recebido', () => {
    expect(emailError('', 'O e-mail de contacto')).toBe('O e-mail de contacto é obrigatório.');
  });
});

describe('passwordPolicyError', () => {
  it('exige 8 a 128 caracteres, com uma letra e um algarismo', () => {
    expect(passwordPolicyError('Ab1')).toMatch(/entre 8 e 128/);
    expect(passwordPolicyError(`Ab1${'x'.repeat(126)}`)).toMatch(/entre 8 e 128/);
    expect(passwordPolicyError('12345678')).toMatch(/uma letra e um algarismo/);
    expect(passwordPolicyError('abcdefgh')).toMatch(/uma letra e um algarismo/);
    expect(passwordPolicyError('Segredo123')).toBeNull();
    expect(passwordPolicyError('Ação2026')).toBeNull();
  });
});

describe('texto e algarismos', () => {
  it('requiredText exige o campo e respeita o máximo depois de aparar', () => {
    expect(requiredText(' ', 'O nome', 5)).toBe('O nome é obrigatório.');
    expect(requiredText('123456', 'O nome', 5)).toBe('O nome pode ter no máximo 5 caracteres.');
    expect(requiredText(' 12345 ', 'O nome', 5)).toBeNull();
  });

  it('digitsError exige o número exato de algarismos', () => {
    expect(digitsError('', 'O NIF', 9)).toBe('O NIF é obrigatório.');
    expect(digitsError('12345678', 'O NIF', 9)).toBe('O NIF deve ter 9 algarismos.');
    expect(digitsError('12345678a', 'O NIF', 9)).toBe('O NIF deve ter 9 algarismos.');
    expect(digitsError('123456789', 'O NIF', 9)).toBeNull();
  });

  it('isDigits e hasLetterAndDigit', () => {
    expect(isDigits('123', 3)).toBe(true);
    expect(isDigits('12a', 3)).toBe(false);
    expect(hasLetterAndDigit('a1')).toBe(true);
    expect(hasLetterAndDigit('aa')).toBe(false);
  });
});

describe('collectErrors', () => {
  it('guarda só os campos com erro', () => {
    const errors = collectErrors({ a: 'erro', b: null });

    expect(errors).toEqual({ a: 'erro' });
    expect(hasErrors(errors)).toBe(true);
    expect(hasErrors({})).toBe(false);
  });
});
