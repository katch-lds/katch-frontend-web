/** Guarda a credencial de sessão (JWT) em memória. O estado completo da sessão é implementado com o login (I069). */
export class SessionStore {
  private token: string | null = null;

  getToken(): string | null {
    return this.token;
  }

  setToken(token: string): void {
    this.token = token;
  }

  clear(): void {
    this.token = null;
  }
}
