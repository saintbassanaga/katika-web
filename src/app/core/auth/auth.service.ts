import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../http/api.service';

export interface UserProfile {
  userId: string;
  fullName: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN' | 'SUPPORT' | 'SUPERVISOR';
  email?: string;
  mfaEnabled: boolean;
  verified: boolean;
  issuedAt: string;
  expiresAt: string;
}

export interface LoginRequest {
  phoneNumber: string;
  password: string;
}

export interface LoginResponse {
  success:      boolean;
  requiresMfa:  boolean;
  challengeId:  string | null;
  mfaExpiresIn: number | null;
  mfaType:      string | null;
  userId:       string | null;
  role:         string | null;
  message:      string;
}

export interface RegisterRequest {
  phoneNumber: string;
  fullName: string;
  password: string;
  email?: string;
}

export interface MfaVerifyRequest {
  challengeId: string;
  code: string;
  backupCode?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword:string;
}

export interface UpdateProfileRequest {
  fullName: string;
  email?: string;
  cniNumber?: string;
}

export interface MfaSetupResponse {
  secretKey: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
  message: string;
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

  verifyMfa(req: MfaVerifyRequest): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      this.url('/bff/auth/mfa/verify'),
      req,
      this.defaultOptions,
    );
  }

  register(req: RegisterRequest): Observable<{ userId: string }> {
    return this.http.post<{ userId: string }>(
      this.url('/api/auth/register'),
      req,
      this.defaultOptions,
    );
  }

  getMfaSetup(): Observable<MfaSetupResponse> {
    return this.http.get<MfaSetupResponse>(
      this.url('/api/mfa/setup'),
      this.defaultOptions,
    );
  }

  confirmMfa(code: string): Observable<{ enabled: boolean }> {
    return this.http.post<{ enabled: boolean }>(
      this.url('/api/mfa/confirm'),
      { code },
      this.defaultOptions,
    );
  }

  disableMfa(code: string): Observable<{ enabled: boolean }> {
    return this.http.post<{ enabled: boolean }>(
      this.url('/api/mfa/disable'),
      { code },
      this.defaultOptions,
    );
  }

  updateProfile(req: UpdateProfileRequest): Observable<void> {
    return this.http.patch<void>(
      this.url('/api/users/me'),
      req,
      this.defaultOptions,
    );
  }

  changePassword(req: ChangePasswordRequest): Observable<void> {
    return this.http.patch<void>(
      this.url('/api/users/me/password'),
      req,
      this.defaultOptions,
    );
  }

  requestVerification(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      this.url('/api/users/me/verification'),
      {},
      this.defaultOptions,
    );
  }

  forgotPassword(phoneNumber: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      this.url('/api/auth/password/reset-request'),
      { phoneNumber },
      this.defaultOptions,
    );
  }

  resetPassword(req: { phoneNumber: string; code: string; newPassword: string }): Observable<void> {
    return this.http.post<void>(
      this.url('/api/auth/password/reset-confirm'),
      req,
      this.defaultOptions,
    );
  }
}
