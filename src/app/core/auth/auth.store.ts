import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY, firstValueFrom } from 'rxjs';
import { AuthService, LoginResponse, UserProfile } from './auth.service';
import { Router } from '@angular/router';

interface AuthState {
  user: UserProfile | null;
  mfaRequired: boolean;
  challengeToken: string | null;
  loading: boolean;
  initialized: boolean;
}

export const AuthStore = signalStore(
  { providedIn: 'root' },

  withState<AuthState>({
    user: null,
    mfaRequired: false,
    challengeToken: null,
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
    hasMfa: computed(() => user()?.mfaEnabled ?? false),
    fullName: computed(() => user() ? `${user()!.firstName} ${user()!.lastName}` : ''),
    initials: computed(() => {
      const u = user();
      if (!u) return '';
      return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
    }),
  })),

  withMethods((store, svc = inject(AuthService), router = inject(Router)) => ({

    async init(): Promise<void> {
      try {
        const user = await firstValueFrom(svc.getMe());
        patchState(store, { user, initialized: true });
      } catch {
        patchState(store, { initialized: true });
      }
    },

    login: rxMethod<{ username: string; password: string }>(pipe(
      tap(() => patchState(store, { loading: true })),
      switchMap(creds => svc.login(creds).pipe(
        tap((res: LoginResponse) => {
          if (res.mfaRequired) {
            patchState(store, {
              mfaRequired: true,
              challengeToken: res.challengeToken ?? null,
              loading: false,
            });
            router.navigate(['/auth/mfa-verify']);
          } else {
            patchState(store, { user: res.user!, loading: false });
            router.navigate(['/dashboard']);
          }
        }),
        catchError(() => {
          patchState(store, { loading: false });
          return EMPTY;
        }),
      )),
    )),

    verifyMfa: rxMethod<{ code: string }>(pipe(
      tap(() => patchState(store, { loading: true })),
      switchMap(({ code }) => svc.verifyMfa({
        code,
        challengeToken: store.challengeToken()!,
      }).pipe(
        tap(user => {
          patchState(store, {
            user,
            mfaRequired: false,
            challengeToken: null,
            loading: false,
          });
          router.navigate(['/dashboard']);
        }),
        catchError(() => {
          patchState(store, { loading: false });
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
            challengeToken: null,
          });
          router.navigate(['/auth/login']);
        }),
        catchError(() => EMPTY),
      )),
    )),

    updateUser(user: UserProfile): void {
      patchState(store, { user });
    },
  })),
);
