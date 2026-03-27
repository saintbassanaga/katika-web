import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../http/api.service';
import {
  ChangePasswordRequest,
  LoginRequest,
  LoginResponse,
  MfaSetupResponse,
  MfaVerifyRequest,
  RegisterRequest,
  UpdateProfileRequest,
  UserProfile,
  UserProfileResponse,
  VerificationRequestResponse,
} from '@shared/models/model';

export type {
  ChangePasswordRequest,
  LoginRequest,
  LoginResponse,
  MfaSetupResponse,
  MfaVerifyRequest,
  RegisterRequest,
  UpdateProfileRequest,
  UserProfile,
  UserProfileResponse,
  VerificationRequestResponse,
};

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

  getProfile(): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(
      this.url('/api/users/me'),
      this.defaultOptions,
    );
  }

  updateProfile(req: UpdateProfileRequest): Observable<UserProfileResponse> {
    return this.http.patch<UserProfileResponse>(
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

  requestVerification(bill1: File, bill2: File, notes?: string): Observable<VerificationRequestResponse> {
    const fd = new FormData();
    fd.append('bill1', bill1);
    fd.append('bill2', bill2);
    if (notes?.trim()) fd.append('notes', notes.trim());
    return this.http.post<VerificationRequestResponse>(
      this.url('/api/users/me/verification'),
      fd,
      { withCredentials: true },
    );
  }

  getVerificationStatus(): Observable<VerificationRequestResponse | null> {
    return this.http.get<VerificationRequestResponse | null>(
      this.url('/api/users/me/verification'),
      this.defaultOptions,
    );
  }

  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(
      this.url('/api/auth/forgot-password'),
      { email },
      this.defaultOptions,
    );
  }

  resetPassword(req: { token: string; newPassword: string; confirmPassword: string }): Observable<void> {
    return this.http.post<void>(
      this.url('/api/auth/reset-password'),
      req,
      this.defaultOptions,
    );
  }
}
