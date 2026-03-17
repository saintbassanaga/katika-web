import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY, firstValueFrom } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { AuthService, UpdateProfileRequest, UserProfile } from './auth.service';
import { Router } from '@angular/router';
import { ToastService } from '../notification/toast.service';
import { AuthState } from '@shared/models/model';

const ROLE_KEY = 'katika_role';

export const AuthStore = signalStore(
  { providedIn: 'root' },

  withState<AuthState>({
    user: null,
    storedRole: sessionStorage.getItem(ROLE_KEY),
    mfaRequired: false,
    challengeId: null,
    loading: false,
    initialized: false,
  }),

  withComputed(({ user, storedRole }) => ({
    isAuthenticated: computed(() => !!user()),
    role:       computed(() => user()?.role ?? storedRole() ?? null),
    isBuyer:    computed(() => (user()?.role ?? storedRole()) === 'BUYER'),
    isSeller:   computed(() => (user()?.role ?? storedRole()) === 'SELLER'),
    isSupport:  computed(() => ['ADMIN', 'SUPPORT', 'SUPERVISOR'].includes(user()?.role ?? storedRole() ?? '')),
    isAdmin:    computed(() => (user()?.role ?? storedRole()) === 'ADMIN'),
    hasMfa:     computed(() => user()?.mfaEnabled ?? false),
    isVerified: computed(() => user()?.verified   ?? false),
    fullName:   computed(() => user()?.fullName ?? ''),
    userId:     computed(() => user()?.userId ?? ''),
    initials:   computed(() => {
      const parts = (user()?.fullName ?? '').trim().split(/\s+/);
      if (parts.length === 0 || !parts[0]) return '';
      const first = parts[0][0] ?? '';
      const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';
      return `${first}${last}`.toUpperCase();
    }),
  })),

  withMethods((store, svc = inject(AuthService), router = inject(Router), toast = inject(ToastService), translate = inject(TranslateService)) => ({

    async init(): Promise<void> {
      try {
        const user = await firstValueFrom(svc.getMe());
        const storedRole = user.role ?? sessionStorage.getItem(ROLE_KEY);
        if (storedRole) sessionStorage.setItem(ROLE_KEY, storedRole);
        patchState(store, { user, storedRole, initialized: true });
      } catch {
        sessionStorage.removeItem(ROLE_KEY);
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
          const loginRole = res.role ?? null;
          return svc.getMe().pipe(
            tap(user => {
              const storedRole = user.role ?? loginRole;
              if (storedRole) sessionStorage.setItem(ROLE_KEY, storedRole);
              patchState(store, { user, storedRole, loading: false });
              const isStaff = ['ADMIN', 'SUPERVISOR', 'SUPPORT'].includes(storedRole ?? '');
              router.navigate([isStaff ? '/admin' : '/dashboard']);
            }),
          );
        }),
        catchError((err) => {
          patchState(store, { loading: false });
          if (err?.status === 401) {
            toast.error(translate.instant('toast.loginError'));
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
          svc.getMe().pipe(
            tap(user => {
              const storedRole = user.role ?? sessionStorage.getItem(ROLE_KEY);
              if (storedRole) sessionStorage.setItem(ROLE_KEY, storedRole);
              patchState(store, {
                user,
                storedRole,
                mfaRequired: false,
                challengeId: null,
                loading: false,
              });
              const isStaff = ['ADMIN', 'SUPERVISOR', 'SUPPORT'].includes(storedRole ?? '');
              router.navigate([isStaff ? '/admin' : '/dashboard']);
            }),
          )
        ),
        catchError(() => {
          patchState(store, { loading: false });
          toast.error(translate.instant('toast.mfaError'));
          return EMPTY;
        }),
      )),
    )),

    logout: rxMethod<void>(pipe(
      switchMap(() => svc.logout().pipe(
        tap(() => {
          sessionStorage.removeItem(ROLE_KEY);
          patchState(store, {
            user: null,
            storedRole: null,
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
            toast.success(translate.instant('toast.profileUpdated'));
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
