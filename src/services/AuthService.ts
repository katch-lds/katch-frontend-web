import type { IApiClient } from '../api/IApiClient';
import type {
  ChangePasswordRequest,
  CreateRecruiterAccountRequest,
  LoginRequest,
  LoginResponse,
} from '../types/api';

// I069 — AuthService (modelo de classes do frontend web v02, secção 4; API v02, 6.1).
export interface IAuthService {
  createRecruiterAccount(request: CreateRecruiterAccountRequest): Promise<LoginResponse>;
  login(request: LoginRequest): Promise<LoginResponse>;
  logout(): Promise<void>;
  changePassword(request: ChangePasswordRequest): Promise<void>;
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

  /** Serve todos os tipos de conta (RF040, RF084). A credencial atual continua válida até expirar. */
  changePassword(request: ChangePasswordRequest): Promise<void> {
    return this.api.put<void>('/api/auth/password', request);
  }
}
