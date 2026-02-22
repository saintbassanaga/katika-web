import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../http/api.service';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN' | 'SUPPORT' | 'SUPERVISOR';
  mfaEnabled: boolean;
  verified: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  mfaRequired: boolean;
  challengeToken?: string;
  user?: UserProfile;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  password: string;
  role: 'BUYER' | 'SELLER';
}

export interface MfaVerifyRequest {
  code: string;
  challengeToken: string;
}

export interface MfaSetupResponse {
  qrCodeUri: string;
  backupCodes: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService extends ApiService {
  login(creds: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      this.url('/bff/auth/login'),
      creds,
      this.defaultOptions,
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(
      this.url('/bff/auth/logout'),
      {},
      this.defaultOptions,
    );
  }

  refreshToken(): Observable<void> {
    return this.http.post<void>(
      this.url('/bff/auth/refresh'),
      {},
      this.defaultOptions,
    );
  }

  getMe(): Observable<UserProfile> {
    return this.http.get<UserProfile>(
      this.url('/bff/auth/me'),
      this.defaultOptions,
    );
  }

  verifyMfa(req: MfaVerifyRequest): Observable<UserProfile> {
    return this.http.post<UserProfile>(
      this.url('/bff/auth/mfa/verify'),
      req,
      this.defaultOptions,
    );
  }

  register(req: RegisterRequest): Observable<{ userId: string }> {
    return this.http.post<{ userId: string }>(
      this.url('/auth/register'),
      req,
      this.defaultOptions,
    );
  }

  getMfaSetup(): Observable<MfaSetupResponse> {
    return this.http.get<MfaSetupResponse>(
      this.url('/mfa/setup'),
      this.defaultOptions,
    );
  }

  confirmMfa(code: string): Observable<{ enabled: boolean }> {
    return this.http.post<{ enabled: boolean }>(
      this.url('/mfa/confirm'),
      { code },
      this.defaultOptions,
    );
  }

  disableMfa(code: string): Observable<{ enabled: boolean }> {
    return this.http.post<{ enabled: boolean }>(
      this.url('/mfa/disable'),
      { code },
      this.defaultOptions,
    );
  }
}
