import { GALLERY_MAX_MB, LOGO_MAX_MB } from '../config/app';
import { BYTES_PER_MB, validateImageFile } from './files';

function image(type: string, size: number): File {
  const file = new File(['x'], 'imagem', { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

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
