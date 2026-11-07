/** Interface única dos pedidos à API (modelo de classes do frontend web v02, secção 4.1). */
export interface IApiClient {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  put<T>(path: string, body?: unknown): Promise<T>;
  delete(path: string): Promise<void>;
  upload(method: 'POST' | 'PUT', path: string, file: File): Promise<string | null>;
  getFile(path: string): Promise<Blob>;
}
