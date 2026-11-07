/** Retira as barras finais de um endereço, sem expressões regulares (evita o retrocesso da S8786). */
export function trimTrailingSlashes(url: string): string {
  let end = url.length;
  while (end > 0 && url[end - 1] === '/') {
    end--;
  }
  return url.slice(0, end);
}
