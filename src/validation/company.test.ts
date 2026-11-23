import { toCompanyPageRequest, validateCompanyPage } from './company';

describe('validateCompanyPage', () => {
  it('aceita a descrição com 1000 caracteres e rejeita a de 1001', () => {
    expect(validateCompanyPage({ description: 'a'.repeat(1000), website: '' })).toEqual({});
    expect(validateCompanyPage({ description: 'a'.repeat(1001), website: '' })).toHaveProperty(
      'description',
    );
  });

  it.each(['https://www.exemplo.pt', 'http://exemplo.pt/empresa', ''])(
    'aceita o sítio «%s»',
    (website) => {
      expect(validateCompanyPage({ description: '', website })).toEqual({});
    },
  );

  it.each(['www.exemplo.pt', 'ftp://exemplo.pt', 'https://', 'http://exemplo pt'])(
    'rejeita o sítio «%s»',
    (website) => {
      expect(validateCompanyPage({ description: '', website })).toHaveProperty('website');
    },
  );
});

describe('toCompanyPageRequest', () => {
  it('apara o texto e converte o texto vazio em null', () => {
    expect(toCompanyPageRequest({ description: '  Café  ', website: ' https://a.pt ' })).toEqual({
      description: 'Café',
      website: 'https://a.pt',
    });
    expect(toCompanyPageRequest({ description: '   ', website: '' })).toEqual({
      description: null,
      website: null,
    });
  });
});
