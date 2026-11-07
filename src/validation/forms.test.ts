import { companyRegistration, companyRegistrationDto } from '../../test/fixtures';
import {
  companyFormFrom,
  EMPTY_COMPANY_FORM,
  validateChangePassword,
  toCompanyRequest,
  validateAccount,
  validateCompany,
  validateLogin,
} from './forms';

describe('validateLogin', () => {
  it('só exige o e-mail e a palavra-passe preenchidos, sem política de palavra-passe', () => {
    expect(validateLogin({ email: ' ', password: '' })).toEqual({
      email: 'O e-mail é obrigatório.',
      password: 'A palavra-passe é obrigatória.',
    });
    expect(validateLogin({ email: 'qualquer coisa', password: 'x' })).toEqual({});
  });
});

describe('validateAccount', () => {
  it('aplica o formato do e-mail, a política da palavra-passe e a aceitação das condições', () => {
    const errors = validateAccount({ email: 'ana', password: 'curta', acceptTerms: false });

    expect(Object.keys(errors).sort()).toEqual(['acceptTerms', 'email', 'password']);
    expect(
      validateAccount({ email: 'ana@exemplo.pt', password: 'Segredo123', acceptTerms: true }),
    ).toEqual({});
  });
});

describe('validateCompany', () => {
  it('aceita os oito dados válidos', () => {
    expect(validateCompany(companyRegistration())).toEqual({});
  });

  it('assinala os oito campos vazios', () => {
    expect(Object.keys(validateCompany(EMPTY_COMPANY_FORM)).sort()).toEqual([
      'address',
      'companyName',
      'contactEmail',
      'contactPhone',
      'industry',
      'locationId',
      'responsibleName',
      'taxId',
    ]);
  });

  it('rejeita o NIF e o telefone sem 9 algarismos, o e-mail inválido e os textos longos', () => {
    const errors = validateCompany(
      companyRegistration({
        taxId: '12345',
        contactPhone: '25312345a',
        contactEmail: 'geral',
        companyName: 'x'.repeat(201),
        address: 'x'.repeat(256),
        responsibleName: 'x'.repeat(151),
      }),
    );

    expect(Object.keys(errors).sort()).toEqual([
      'address',
      'companyName',
      'contactEmail',
      'contactPhone',
      'responsibleName',
      'taxId',
    ]);
  });

  it('rejeita uma área de atividade fora da lista', () => {
    const errors = validateCompany({ ...companyRegistration(), industry: 'NADA' as never });

    expect(errors.industry).toBe('A área de atividade escolhida não é válida.');
  });
});

describe('toCompanyRequest', () => {
  it('apara o texto antes de enviar', () => {
    const request = toCompanyRequest({
      ...companyRegistration(),
      companyName: '  Café Central  ',
      taxId: ' 123456789 ',
    });

    expect(request.companyName).toBe('Café Central');
    expect(request.taxId).toBe('123456789');
  });
});

describe('validateChangePassword', () => {
  const valid = {
    currentPassword: 'katch2025',
    newPassword: 'katch2026',
    confirmPassword: 'katch2026',
  };

  it('aceita a atual preenchida, a nova dentro da política e a confirmação igual', () => {
    expect(validateChangePassword(valid)).toEqual({});
  });

  it('exige a palavra-passe atual', () => {
    expect(validateChangePassword({ ...valid, currentPassword: '' })).toEqual({
      currentPassword: 'A palavra-passe atual é obrigatória.',
    });
  });

  it('aplica a política à nova palavra-passe (katch é curta e sem algarismo)', () => {
    const errors = validateChangePassword({
      ...valid,
      newPassword: 'katch',
      confirmPassword: 'katch',
    });

    expect(Object.keys(errors)).toEqual(['newPassword']);
  });

  it('exige a confirmação e que coincida com a nova', () => {
    expect(validateChangePassword({ ...valid, confirmPassword: '' }).confirmPassword).toBe(
      'Confirme a nova palavra-passe.',
    );
    expect(validateChangePassword({ ...valid, confirmPassword: 'katch2027' }).confirmPassword).toBe(
      'A confirmação não coincide com a nova palavra-passe.',
    );
  });
});

describe('companyFormFrom', () => {
  it('converte os dados de registo nos valores do formulário, sem o que não se edita', () => {
    expect(companyFormFrom(companyRegistrationDto())).toEqual(companyRegistration());
  });
});
