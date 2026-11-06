import type { IApiClient } from '../api/IApiClient';
import type { CreateRecruiterAccountRequest, LoginRequest, LoginResponse } from '../types/api';

// I069 — AuthService (modelo de classes do frontend web v02, secção 4; API v02, 6.1).
export interface IAuthService {
  createRecruiterAccount(request: CreateRecruiterAccountRequest): Promise<LoginResponse>;
  login(request: LoginRequest): Promise<LoginResponse>;
  logout(): Promise<void>;
}

/** Autenticação: criação de conta de Recrutador, início e fim de sessão (AuthController). */
export class AuthService implements IAuthService {
  constructor(private readonly api: IApiClient) {}

  createRecruiterAccount(request: CreateRecruiterAccountRequest): Promise<LoginResponse> {
    return this.api.post<LoginResponse>('/api/auth/recruiters', request);
  }

  login(request: LoginRequest): Promise<LoginResponse> {
    return this.api.post<LoginResponse>('/api/auth/login', request);
  }

  /** O servidor não guarda estado: o fim de sessão efetivo é o cliente descartar a credencial. */
  logout(): Promise<void> {
    return this.api.post<void>('/api/auth/logout');
  }
}
