import {
  BYTES_PER_MB,
  GALLERY_MAX_MB,
  LOGO_MAX_MB,
  toCompanyPageRequest,
  validateCompanyPage,
  validateImageFile,
} from './company';

function image(type: string, size: number): File {
  const file = new File(['x'], 'imagem', { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

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

describe('validateImageFile', () => {
  it.each(['image/jpeg', 'image/png'])('aceita %s', (type) => {
    expect(validateImageFile(image(type, 1000), LOGO_MAX_MB)).toBeNull();
  });

  it('rejeita GIF', () => {
    expect(validateImageFile(image('image/gif', 1000), LOGO_MAX_MB)).toMatch(/JPEG ou PNG/);
  });

  it('o logótipo aceita exatamente 2 MB e rejeita acima', () => {
    expect(validateImageFile(image('image/png', 2 * BYTES_PER_MB), LOGO_MAX_MB)).toBeNull();
    expect(validateImageFile(image('image/png', 2 * BYTES_PER_MB + 1), LOGO_MAX_MB)).toMatch(
      /2 MB/,
    );
  });

  it('a galeria aceita exatamente 5 MB e rejeita acima', () => {
    expect(validateImageFile(image('image/jpeg', 5 * BYTES_PER_MB), GALLERY_MAX_MB)).toBeNull();
    expect(validateImageFile(image('image/jpeg', 5 * BYTES_PER_MB + 1), GALLERY_MAX_MB)).toMatch(
      /5 MB/,
    );
  });
});
