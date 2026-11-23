// Formato e dimensão das imagens antes do carregamento (secção 5, regra 8). O servidor volta a validar tudo,
// incluindo o conteúdo dos ficheiros (RNF016).

export const BYTES_PER_MB = 1024 * 1024;
export const IMAGE_TYPES = ['image/jpeg', 'image/png'];

/**
 * Erro de formato ou de dimensão de uma imagem, ou null; o limite é inclusivo. `subject` abre a mensagem (por
 * exemplo, «O ficheiro» ou «a fotografia»).
 */
export function validateImageFile(
  file: File,
  maxMb: number,
  subject = 'O ficheiro',
): string | null {
  if (!IMAGE_TYPES.includes(file.type)) {
    return `${subject} tem de estar no formato JPEG ou PNG.`;
  }
  return file.size > maxMb * BYTES_PER_MB ? `${subject} pode ter no máximo ${maxMb} MB.` : null;
}
