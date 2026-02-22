import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY, firstValueFrom } from 'rxjs';
import { AuthService, UpdateProfileRequest, UserProfile } from './auth.service';
import { Router } from '@angular/router';
import { ToastService } from '../notification/toast.service';

interface AuthState {
  user: UserProfile | null;
  mfaRequired: boolean;
  challengeId: string | null;
  loading: boolean;
  initialized: boolean;
}

export const AuthStore = signalStore(
  { providedIn: 'root' },

  withState<AuthState>({
    user: null,
    mfaRequired: false,
    challengeId: null,
    loading: false,
    initialized: false,
  }),

  withComputed(({ user }) => ({
    isAuthenticated: computed(() => !!user()),
    role: computed(() => user()?.role ?? null),
    isBuyer: computed(() => user()?.role === 'BUYER'),
    isSeller: computed(() => user()?.role === 'SELLER'),
    isSupport: computed(() => ['ADMIN', 'SUPPORT', 'SUPERVISOR'].includes(user()?.role ?? '')),
    isAdmin: computed(() => user()?.role === 'ADMIN'),
    hasMfa:      computed(() => user()?.mfaEnabled ?? false),
    isVerified:  computed(() => user()?.verified   ?? false),
    fullName: computed(() => user()?.fullName ?? ''),
    initials: computed(() => {
      const parts = (user()?.fullName ?? '').trim().split(/\s+/);
      if (parts.length === 0 || !parts[0]) return '';
      const first = parts[0][0] ?? '';
      const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';
      return `${first}${last}`.toUpperCase();
    }),
  })),

  withMethods((store, svc = inject(AuthService), router = inject(Router), toast = inject(ToastService)) => ({

    async init(): Promise<void> {
      try {
        const user = await firstValueFrom(svc.getMe());
        patchState(store, { user, initialized: true });
      } catch {
        patchState(store, { initialized: true });
      }
    },

    login: rxMethod<{ phoneNumber: string; password: string }>(pipe(
      tap(() => patchState(store, { loading: true })),
      switchMap(creds => svc.login(creds).pipe(
        switchMap(res => {
          if (res.requiresMfa) {
            patchState(store, {
              mfaRequired: true,
              challengeId: res.challengeId,
              loading: false,
            });
            router.navigate(['/auth/mfa-verify']);
            return EMPTY;
          }
          // No MFA — session cookie is set, fetch user profile
          return svc.getMe().pipe(
            tap(user => {
              patchState(store, { user, loading: false });
              router.navigate(['/dashboard']);
            }),
          );
        }),
        catchError((err) => {
          patchState(store, { loading: false });
          if (err?.status === 401) {
            toast.error('Numéro de téléphone ou mot de passe incorrect.');
          }
          return EMPTY;
        }),
      )),
    )),

    verifyMfa: rxMethod<{ code: string; backupCode?: string }>(pipe(
      tap(() => patchState(store, { loading: true })),
      switchMap(({ code, backupCode }) => svc.verifyMfa({
        challengeId: store.challengeId()!,
        code,
        ...(backupCode ? { backupCode } : {}),
      }).pipe(
        switchMap(() =>
          // Session cookie set server-side — now fetch the user profile
          svc.getMe().pipe(
            tap(user => {
              patchState(store, {
                user,
                mfaRequired: false,
                challengeId: null,
                loading: false,
              });
              router.navigate(['/dashboard']);
            }),
          )
        ),
        catchError(() => {
          patchState(store, { loading: false });
          toast.error('Code MFA invalide. Réessayez.');
          return EMPTY;
        }),
      )),
    )),

    logout: rxMethod<void>(pipe(
      switchMap(() => svc.logout().pipe(
        tap(() => {
          patchState(store, {
            user: null,
            mfaRequired: false,
            challengeId: null,
          });
          router.navigate(['/auth/login']);
        }),
        catchError(() => EMPTY),
      )),
    )),

    updateUser(user: UserProfile): void {
      patchState(store, { user });
    },

    updateProfile: rxMethod<UpdateProfileRequest>(pipe(
      tap(() => patchState(store, { loading: true })),
      switchMap(req => svc.updateProfile(req).pipe(
        switchMap(() => svc.getMe().pipe(
          tap(user => {
            patchState(store, { user, loading: false });
            toast.success('Profil mis à jour avec succès.');
            router.navigate(['/profile']);
          }),
        )),
        catchError(() => {
          patchState(store, { loading: false });
          return EMPTY;
        }),
      )),
    )),
  })),
);
