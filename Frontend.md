# Katika — Frontend Implementation Guide

> Angular 20+ · Mobile-First PWA · Feature-Shell Architecture
> Everything that needs to be built on the frontend side, mapped 1:1 to the backend contracts.

---

## Table of Contents

1. [Project Scaffold](#1-project-scaffold)
2. [Folder Structure (Feature-Shell)](#2-folder-structure-feature-shell)
3. [Environment & API Configuration](#3-environment--api-configuration)
4. [Design System & Tokens](#4-design-system--tokens)
5. [Core Layer](#5-core-layer)
  - [HTTP Client Setup](#51-http-client-setup)
  - [Interceptors](#52-interceptors)
  - [Auth Store (Signal Store)](#53-auth-store-signal-store)
  - [Route Guards](#54-route-guards)
  - [WebSocket Service](#55-websocket-service)
  - [Error Handling](#56-error-handling)
6. [Shell & Layout](#6-shell--layout)
7. [Feature: Authentication](#7-feature-authentication)
  - [Register](#71-register)
  - [Login](#72-login)
  - [MFA Enrollment](#73-mfa-enrollment)
  - [MFA Verification (Login Flow)](#74-mfa-verification-login-flow)
8. [Feature: Dashboard](#8-feature-dashboard)
9. [Feature: Escrow Transactions](#9-feature-escrow-transactions)
  - [Transaction List](#91-transaction-list)
  - [Transaction Detail](#92-transaction-detail)
  - [QR Code Scan (Release Flow)](#93-qr-code-scan-release-flow)
  - [QR Code Display (Seller)](#94-qr-code-display-seller)
10. [Feature: Disputes](#10-feature-disputes)
  - [Dispute Creation](#101-dispute-creation)
  - [Real-Time Dispute Chat](#102-real-time-dispute-chat)
  - [Evidence Upload](#103-evidence-upload)
  - [Dispute Resolution (Admin/Support)](#104-dispute-resolution-adminsupport)
11. [Feature: Payouts](#11-feature-payouts)
  - [Request Payout](#111-request-payout)
  - [OTP Verification](#112-otp-verification)
12. [Feature: Profile & Settings](#12-feature-profile--settings)
13. [Feature: Wallet](#13-feature-wallet)
14. [Shared Components](#14-shared-components)
15. [Mobile-First Responsive Strategy](#15-mobile-first-responsive-strategy)
16. [PWA Configuration](#16-pwa-configuration)
17. [Performance for Low-Bandwidth Networks](#17-performance-for-low-bandwidth-networks)
18. [Testing](#18-testing)
19. [Build & CI/CD](#19-build--cicd)
20. [API Contract Reference](#20-api-contract-reference)

---

## 1. Project Scaffold

```bash
# Node 22+ required
node --version   # v22.x.x
npm --version    # 10.x.x

# Install Angular CLI 20
npm install -g @angular/cli@20

# Scaffold new application
ng new katika-web \
  --routing \
  --style=scss \
  --ssr=false \
  --standalone \
  --strict

cd katika-web

# ─── Core dependencies ────────────────────────────────────────────
npm install \
  @ngrx/signals \
  @stomp/stompjs \
  sockjs-client \
  zxing-browser \
  qrcode \
  dayjs

# ─── Dev dependencies ─────────────────────────────────────────────
npm install -D \
  @types/sockjs-client \
  @types/qrcode

# ─── PWA support ──────────────────────────────────────────────────
ng add @angular/pwa

# ─── Verify setup ─────────────────────────────────────────────────
ng serve
# → http://localhost:4200
```

**`tsconfig.json` — strict additions:**
```json
{
  "compilerOptions": {
    "strict": true,
    "strictTemplates": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "forceConsistentCasingInFileNames": true,
    "target": "ES2022",
    "useDefineForClassFields": false
  }
}
```

---

## 2. Folder Structure (Feature-Shell)

```
src/
├── app/
│   │
│   ├── core/                          ← Singleton, app-wide concerns
│   │   ├── auth/
│   │   │   ├── auth.service.ts        ← BFF HTTP calls (login, logout, refresh, me)
│   │   │   ├── auth.store.ts          ← NgRx Signal Store (global auth state)
│   │   │   ├── auth.guard.ts          ← CanActivate: isAuthenticated
│   │   │   └── role.guard.ts          ← CanActivate: role-based access
│   │   ├── http/
│   │   │   ├── csrf.interceptor.ts    ← Reads XSRF-TOKEN cookie → X-XSRF-TOKEN header
│   │   │   ├── auth.interceptor.ts    ← 401 → silent refresh → retry
│   │   │   ├── offline.interceptor.ts ← Detect navigator.onLine = false
│   │   │   └── error.interceptor.ts   ← Map HTTP errors → user-friendly messages
│   │   ├── websocket/
│   │   │   └── stomp.service.ts       ← Singleton STOMP connection (lazy connect)
│   │   ├── notification/
│   │   │   └── toast.service.ts       ← Global toast notifications (Signal-based)
│   │   └── core.providers.ts          ← Export all providers for app.config.ts
│   │
│   ├── shared/                        ← Reusable, stateless UI components
│   │   ├── components/
│   │   │   ├── amount-display/        ← Format XAF currency (e.g. 50 000 XAF)
│   │   │   ├── avatar/                ← User avatar with fallback initials
│   │   │   ├── badge/                 ← Status badges (LOCKED, DISPUTED, etc.)
│   │   │   ├── bottom-sheet/          ← Mobile action sheet
│   │   │   ├── button/                ← Katika branded button (primary/ghost/danger)
│   │   │   ├── card/                  ← Elevated card for mobile lists
│   │   │   ├── empty-state/           ← "No data" illustration + CTA
│   │   │   ├── form-field/            ← Input wrapper with label + error
│   │   │   ├── loading-skeleton/      ← Skeleton screens (never spinners for lists)
│   │   │   ├── otp-input/             ← 6-digit OTP auto-tab input
│   │   │   ├── phone-input/           ← CMR phone number input (+237 prefix)
│   │   │   ├── pin-input/             ← Numeric PIN pad (touch-optimized)
│   │   │   ├── progress-stepper/      ← Horizontal step indicator for flows
│   │   │   ├── pull-to-refresh/       ← Mobile pull-to-refresh directive
│   │   │   ├── status-timeline/       ← Escrow transaction state visual timeline
│   │   │   └── toast/                 ← Toast notification container + item
│   │   ├── directives/
│   │   │   ├── long-press.directive.ts
│   │   │   └── swipe.directive.ts
│   │   ├── pipes/
│   │   │   ├── amount.pipe.ts         ← Format as "50 000 XAF"
│   │   │   ├── phone-mask.pipe.ts     ← "+237 6XX XXX XXX"
│   │   │   ├── time-ago.pipe.ts       ← "3 minutes ago" (dayjs)
│   │   │   └── transaction-ref.pipe.ts← "KT-2025-000123"
│   │   └── shared.ts                  ← Export all shared components/pipes
│   │
│   ├── features/
│   │   ├── auth/                      ← Login, Register, MFA
│   │   ├── dashboard/                 ← Role-aware home screen
│   │   ├── escrow/                    ← Transaction list + detail + QR flows
│   │   ├── disputes/                  ← Dispute list + real-time chat
│   │   ├── payouts/                   ← Mobile money withdrawal
│   │   ├── profile/                   ← Account settings + MFA management
│   │   ├── wallet/                    ← Balance + movement history
│   │   └── admin/                     ← ADMIN/SUPPORT-only views
│   │
│   ├── app.routes.ts
│   ├── app.config.ts
│   └── app.component.ts               ← Shell layout (bottom nav ↔ sidebar)
│
├── environments/
│   ├── environment.ts                 ← { apiUrl: 'http://localhost:8080', production: false }
│   └── environment.prod.ts            ← { apiUrl: 'https://api.katika.cm', production: true }
│
└── styles/
    ├── _tokens.scss                   ← Colors, spacing, radius, shadows
    ├── _typography.scss               ← Font scale (clamp-based)
    ├── _breakpoints.scss              ← Mobile-first mixin
    ├── _reset.scss                    ← Box-sizing, margin resets
    ├── _animations.scss               ← View transition helpers
    └── main.scss                      ← @forward all partials
```

---

## 3. Environment & API Configuration

**`environments/environment.ts`:**
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
  wsUrl: 'http://localhost:8080/ws',
  debug: true,
};
```

**`environments/environment.prod.ts`:**
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.katika.cm',
  wsUrl: 'https://api.katika.cm/ws',
  debug: false,
};
```

**`app.config.ts`:**
```typescript
import { ApplicationConfig, APP_INITIALIZER, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions, withPreloading, PreloadAllModules } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { routes } from './app.routes';
import { csrfInterceptor } from './core/http/csrf.interceptor';
import { authInterceptor } from './core/http/auth.interceptor';
import { offlineInterceptor } from './core/http/offline.interceptor';
import { errorInterceptor } from './core/http/error.interceptor';
import { AuthStore } from './core/auth/auth.store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions(),
      withPreloading(PreloadAllModules),
    ),
    provideHttpClient(
      withFetch(),
      withInterceptors([
        offlineInterceptor,   // 1st: short-circuit if offline
        csrfInterceptor,      // 2nd: attach XSRF token
        authInterceptor,      // 3rd: handle 401 → refresh
        errorInterceptor,     // 4th: map errors → toasts
      ]),
    ),
    // Restore session on every page load
    {
      provide: APP_INITIALIZER,
      useFactory: (store: AuthStore) => () => store.init(),
      deps: [AuthStore],
      multi: true,
    },
  ],
};
```

---

## 4. Design System & Tokens

**`styles/_tokens.scss`:**
```scss
:root {
  // ─── Brand ──────────────────────────────
  --color-primary:        #1A56DB;   // Katika blue
  --color-primary-light:  #EBF5FF;
  --color-primary-dark:   #1036A0;

  --color-success:        #0D9B5B;
  --color-warning:        #E67C00;
  --color-danger:         #DC2626;
  --color-info:           #0891B2;

  // ─── Neutral ────────────────────────────
  --color-surface:        #FFFFFF;
  --color-surface-alt:    #F8FAFC;
  --color-border:         #E2E8F0;
  --color-text:           #0F172A;
  --color-text-muted:     #64748B;
  --color-text-inverse:   #FFFFFF;

  // ─── Spacing (4px base grid) ────────────
  --space-1: 4px;   --space-2: 8px;    --space-3: 12px;
  --space-4: 16px;  --space-5: 20px;   --space-6: 24px;
  --space-8: 32px;  --space-10: 40px;  --space-12: 48px;
  --space-16: 64px;

  // ─── Border radius ───────────────────────
  --radius-sm:   6px;
  --radius-md:   12px;
  --radius-lg:   20px;
  --radius-full: 9999px;

  // ─── Shadows ─────────────────────────────
  --shadow-sm: 0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.06);
  --shadow-md: 0 4px 12px rgba(0,0,0,.10), 0 2px 4px rgba(0,0,0,.06);
  --shadow-lg: 0 10px 32px rgba(0,0,0,.12);

  // ─── Touch targets ───────────────────────
  --touch-target: 44px;   // WCAG 2.5.5 minimum

  // ─── Motion ──────────────────────────────
  --transition-fast:   150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow:   400ms ease;
}
```

**`styles/_typography.scss`:**
```scss
// Fluid type scale — no layout shifts between breakpoints
:root {
  --text-xs:   clamp(0.688rem, 1.5vw, 0.75rem);
  --text-sm:   clamp(0.813rem, 1.8vw, 0.875rem);
  --text-base: clamp(0.938rem, 2vw,   1rem);
  --text-lg:   clamp(1.063rem, 2.2vw, 1.125rem);
  --text-xl:   clamp(1.188rem, 2.5vw, 1.25rem);
  --text-2xl:  clamp(1.375rem, 3vw,   1.5rem);
  --text-3xl:  clamp(1.625rem, 4vw,   2rem);
  --text-4xl:  clamp(2rem,     5vw,   2.5rem);
}
```

---

## 5. Core Layer

### 5.1 HTTP Client Setup

All HTTP calls use `withCredentials: true` so that cookies (ACCESS_TOKEN, REFRESH_TOKEN, XSRF-TOKEN) are automatically included. Set a base URL in a service base class:

```typescript
// core/http/api.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable()
export abstract class ApiService {
  protected readonly http = inject(HttpClient);
  protected readonly base = environment.apiUrl;

  protected url(path: string): string {
    return `${this.base}${path}`;
  }

  protected get defaultOptions() {
    return { withCredentials: true };
  }
}
```

### 5.2 Interceptors

**`csrf.interceptor.ts`** — Reads the server-set `XSRF-TOKEN` cookie and sends it as `X-XSRF-TOKEN` on every mutating request:
```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE']);

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  if (SAFE_METHODS.has(req.method)) return next(req);

  const cookie = inject(DOCUMENT).cookie
    .split('; ')
    .find(c => c.startsWith('XSRF-TOKEN='))
    ?.split('=')[1];

  if (!cookie) return next(req);

  return next(req.clone({
    setHeaders: { 'X-XSRF-TOKEN': decodeURIComponent(cookie) },
    withCredentials: true,
  }));
};
```

**`auth.interceptor.ts`** — Handles silent token refresh on 401:
```typescript
import { HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

// Shared refresh lock across all concurrent requests
const refreshing$ = new BehaviorSubject<boolean>(false);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Skip BFF auth endpoints to avoid infinite loops
  if (req.url.includes('/bff/auth/')) return next(req);

  return next(req).pipe(
    catchError(err => {
      if (err.status !== HttpStatusCode.Unauthorized) return throwError(() => err);

      if (!refreshing$.getValue()) {
        refreshing$.next(true);
        return auth.refreshToken().pipe(
          switchMap(() => {
            refreshing$.next(false);
            return next(req.clone({ withCredentials: true }));
          }),
          catchError(refreshErr => {
            refreshing$.next(false);
            router.navigate(['/auth/login'], {
              queryParams: { returnUrl: router.url },
            });
            return throwError(() => refreshErr);
          }),
        );
      }

      // Queue other requests while refresh is in flight
      return refreshing$.pipe(
        filter(isRefreshing => !isRefreshing),
        take(1),
        switchMap(() => next(req.clone({ withCredentials: true }))),
      );
    }),
  );
};
```

**`offline.interceptor.ts`:**
```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { throwError } from 'rxjs';

export const offlineInterceptor: HttpInterceptorFn = (req, next) => {
  if (!navigator.onLine) {
    return throwError(() => ({
      status: 0,
      error: { code: 'OFFLINE', message: 'Vérifiez votre connexion internet.' },
    }));
  }
  return next(req);
};
```

**`error.interceptor.ts`** — Maps backend error codes to user-friendly messages:
```typescript
import { HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../notification/toast.service';

const ERROR_MESSAGES: Record<string, string> = {
  RATE_LIMIT_EXCEEDED:    'Trop de tentatives. Réessayez dans quelques minutes.',
  INSUFFICIENT_BALANCE:   'Solde insuffisant pour cette opération.',
  TRANSACTION_NOT_FOUND:  'Transaction introuvable.',
  INVALID_MFA_CODE:       'Code de vérification invalide.',
  INVALID_OTP:            'Code OTP invalide ou expiré.',
  DISPUTE_ALREADY_EXISTS: 'Un litige est déjà en cours pour cette transaction.',
};

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError(err => {
      const code = err?.error?.error?.code as string;
      const message = ERROR_MESSAGES[code]
        ?? err?.error?.error?.message
        ?? 'Une erreur est survenue. Réessayez.';

      // Don't toast on 401 — auth interceptor handles it
      if (err.status !== HttpStatusCode.Unauthorized) {
        toast.error(message);
      }

      return throwError(() => err);
    }),
  );
};
```

### 5.3 Auth Store (Signal Store)

```typescript
// core/auth/auth.store.ts
import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY, firstValueFrom } from 'rxjs';
import { AuthService, LoginResponse, UserProfile } from './auth.service';
import { Router } from '@angular/router';

interface AuthState {
  user:           UserProfile | null;
  mfaRequired:    boolean;
  challengeToken: string | null;
  loading:        boolean;
  initialized:    boolean;   // true after APP_INITIALIZER completes
}

export const AuthStore = signalStore(
  { providedIn: 'root' },

  withState<AuthState>({
    user: null, mfaRequired: false,
    challengeToken: null, loading: false, initialized: false,
  }),

  withComputed(({ user }) => ({
    isAuthenticated: computed(() => !!user()),
    role:            computed(() => user()?.role ?? null),
    isBuyer:         computed(() => user()?.role === 'BUYER'),
    isSeller:        computed(() => user()?.role === 'SELLER'),
    isSupport:       computed(() => ['ADMIN', 'SUPPORT', 'SUPERVISOR'].includes(user()?.role ?? '')),
    isAdmin:         computed(() => user()?.role === 'ADMIN'),
    hasMfa:          computed(() => user()?.mfaEnabled ?? false),
  })),

  withMethods((store, svc = inject(AuthService), router = inject(Router)) => ({

    /** Called by APP_INITIALIZER — restores session after page reload */
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
            patchState(store, { mfaRequired: true, challengeToken: res.challengeToken, loading: false });
          } else {
            patchState(store, { user: res.user!, loading: false });
            router.navigate(['/dashboard']);
          }
        }),
        catchError(() => { patchState(store, { loading: false }); return EMPTY; }),
      )),
    )),

    verifyMfa: rxMethod<{ code: string }>(pipe(
      switchMap(({ code }) => svc.verifyMfa({ code, challengeToken: store.challengeToken()! }).pipe(
        tap(user => {
          patchState(store, { user, mfaRequired: false, challengeToken: null });
          router.navigate(['/dashboard']);
        }),
        catchError(() => EMPTY),
      )),
    )),

    logout: rxMethod<void>(pipe(
      switchMap(() => svc.logout().pipe(
        tap(() => {
          patchState(store, { user: null, mfaRequired: false, challengeToken: null });
          router.navigate(['/auth/login']);
        }),
        catchError(() => EMPTY),
      )),
    )),
  })),
);
```

### 5.4 Route Guards

```typescript
// core/auth/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from './auth.store';

export const authGuard: CanActivateFn = (route) => {
  const store = inject(AuthStore);
  const router = inject(Router);
  if (store.isAuthenticated()) return true;
  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: route.url.join('/') },
  });
};

// core/auth/role.guard.ts
export const roleGuard = (...roles: string[]): CanActivateFn => () => {
  const store = inject(AuthStore);
  const router = inject(Router);
  if (roles.includes(store.role()!)) return true;
  return router.createUrlTree(['/403']);
};
```

**`app.routes.ts`:**
```typescript
import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component'),
  },
  {
    path: 'escrow',
    canActivate: [authGuard],
    loadChildren: () => import('./features/escrow/escrow.routes').then(m => m.ESCROW_ROUTES),
  },
  {
    path: 'disputes',
    canActivate: [authGuard],
    loadChildren: () => import('./features/disputes/disputes.routes').then(m => m.DISPUTE_ROUTES),
  },
  {
    path: 'payouts',
    canActivate: [authGuard],
    loadChildren: () => import('./features/payouts/payouts.routes').then(m => m.PAYOUT_ROUTES),
  },
  {
    path: 'wallet',
    canActivate: [authGuard],
    loadComponent: () => import('./features/wallet/wallet.component'),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadChildren: () => import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES),
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard('ADMIN', 'SUPERVISOR')],
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
  },
  { path: '403', loadComponent: () => import('./shared/components/forbidden/forbidden.component') },
  { path: '**',  loadComponent: () => import('./shared/components/not-found/not-found.component') },
];
```

### 5.5 WebSocket Service

```typescript
// core/websocket/stomp.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Observable, Subject, filter, map, share } from 'rxjs';
import { environment } from '../../../environments/environment';

interface StompMessage<T = unknown> {
  destination: string;
  body: T;
}

@Injectable({ providedIn: 'root' })
export class StompService implements OnDestroy {
  private client!: Client;
  private readonly messages$ = new Subject<StompMessage>();
  private connectPromise: Promise<void> | null = null;

  /** Lazy connect — called the first time a feature needs WebSocket */
  connect(): Promise<void> {
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = new Promise((resolve, reject) => {
      this.client = new Client({
        webSocketFactory: () => new SockJS(environment.wsUrl),
        reconnectDelay: 5000,
        onConnect: () => resolve(),
        onStompError: frame => reject(new Error(frame.headers['message'])),
        onWebSocketError: err => reject(err),
      });
      this.client.activate();
    });

    return this.connectPromise;
  }

  /** Subscribe to a STOMP destination and get typed messages as Observable */
  on<T>(destination: string): Observable<T> {
    return this.messages$.pipe(
      filter(msg => msg.destination === destination),
      map(msg => msg.body as T),
      share(),
    );
  }

  /** Register a STOMP subscription (returns unsubscribe handle) */
  subscribe(destination: string): StompSubscription {
    return this.client.subscribe(destination, (frame: IMessage) => {
      this.messages$.next({
        destination,
        body: JSON.parse(frame.body),
      });
    });
  }

  publish(destination: string, body: object): void {
    this.client.publish({ destination, body: JSON.stringify(body) });
  }

  disconnect(): void {
    this.connectPromise = null;
    this.client?.deactivate();
  }

  ngOnDestroy(): void { this.disconnect(); }
}
```

### 5.6 Error Handling

```typescript
// core/notification/toast.service.ts
import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  success(message: string) { this.push('success', message); }
  error(message: string)   { this.push('error',   message); }
  warning(message: string) { this.push('warning',  message); }
  info(message: string)    { this.push('info',     message); }

  dismiss(id: string): void {
    this.toasts.update(ts => ts.filter(t => t.id !== id));
  }

  private push(type: ToastType, message: string): void {
    const id = crypto.randomUUID();
    this.toasts.update(ts => [...ts, { id, type, message }]);
    setTimeout(() => this.dismiss(id), 4000);
  }
}
```

---

## 6. Shell & Layout

```typescript
// app.component.ts
import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { AuthStore } from './core/auth/auth.store';
import { ToastContainerComponent } from './shared/components/toast/toast-container.component';
import { BottomNavComponent } from './shared/components/bottom-nav/bottom-nav.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent, BottomNavComponent, SidebarComponent],
  template: `
    <div class="shell" [class.shell--authenticated]="auth.isAuthenticated()">

      @if (auth.isAuthenticated()) {
        @if (isMobile()) {
          <app-bottom-nav />
        } @else {
          <app-sidebar />
        }
      }

      <main class="shell__content" id="main-content" tabindex="-1">
        <router-outlet />
      </main>

      <app-toast-container />
    </div>
  `,
  styleUrl: './app.component.scss',
})
export class AppComponent {
  protected readonly auth = inject(AuthStore);

  private readonly bp = inject(BreakpointObserver);
  protected readonly isMobile = toSignal(
    this.bp.observe([Breakpoints.XSmall, Breakpoints.Small]).pipe(
      map(r => r.matches),
    ),
    { initialValue: true },  // assume mobile until detected otherwise
  );
}
```

**Bottom navigation items (mobile):**

| Icon | Label | Route | Roles |
|---|---|---|---|
| Home | Accueil | `/dashboard` | All |
| Swap | Transactions | `/escrow` | All |
| AlertCircle | Litiges | `/disputes` | All |
| ArrowUpCircle | Retrait | `/payouts` | All |
| User | Profil | `/profile` | All |

---

## 7. Feature: Authentication

### 7.1 Register

**Route:** `/auth/register`
**Backend:** `POST /auth/register`

**Fields:**
- `firstName`, `lastName` — text
- `phone` — `PhoneInputComponent` (+237 prefix enforced)
- `email` — optional, email validation
- `password` — min 8 chars, 1 uppercase, 1 digit, 1 special
- `confirmPassword` — must match
- `role` — select: `BUYER` / `SELLER`

**UX:**
- Password strength meter (4 levels, color-coded)
- Real-time validation with debounce 400ms
- "Show password" toggle
- On success: redirect to `/auth/login` with pre-filled phone

```typescript
// POST /auth/register
interface RegisterRequest {
  firstName:   string;
  lastName:    string;
  phone:       string;   // "+237XXXXXXXXX"
  email?:      string;
  password:    string;
  role:        'BUYER' | 'SELLER';
}
```

### 7.2 Login

**Route:** `/auth/login`
**Backend:** `POST /bff/auth/login`

**Flow:**
```
1. User submits phone + password
2. POST /bff/auth/login
3a. mfaRequired: false  →  redirect to /dashboard
3b. mfaRequired: true   →  navigate to /auth/mfa-verify (preserve challengeToken in AuthStore)
```

**UX:**
- Phone field auto-formatted
- Show/hide password
- "Mot de passe oublié?" link (future feature)
- Loading state on button during request
- Rate limit error: show countdown timer

### 7.3 MFA Enrollment

**Route:** `/profile/security/mfa`
**Backend:** `GET /mfa/setup` → `POST /mfa/confirm`

**Flow:**
```
Step 1 — Setup
  GET /mfa/setup
  ← { qrCodeUri: "data:image/png;base64,...", backupCodes: ["XXXX-XXXX", ...] }
  Display QR code image
  Display 10 backup codes in a grid (button: "Copier tout")

Step 2 — Confirm
  User opens authenticator app, scans QR
  User types 6-digit code
  POST /mfa/confirm { code: "123456" }
  ← { enabled: true }
  Toast: "Authentification à deux facteurs activée"
  Redirect to /profile/security
```

**Components needed:**
- `QrCodeDisplayComponent` — renders `<img [src]="qrCodeUri">`
- `BackupCodesGridComponent` — 2×5 grid, "copy all" button, "Download as PDF" button
- `OtpInputComponent` — 6 individual `<input>` cells, auto-advance, paste support

### 7.4 MFA Verification (Login Flow)

**Route:** `/auth/mfa-verify`
**Backend:** `POST /bff/auth/mfa/verify`

```typescript
interface MfaVerifyRequest {
  code:           string;  // 6-digit TOTP or 8-char backup code
  challengeToken: string;  // from AuthStore.challengeToken
}
```

**UX:**
- OTP 6-cell input (auto-focus first cell on mount)
- Toggle between "Code TOTP" and "Code de secours" (changes input type and length)
- Auto-submit when 6 digits entered
- Show error inline (not toast) for wrong code
- After 5 failures: show lockout countdown

---

## 8. Feature: Dashboard

**Route:** `/dashboard`
**Role-aware content:**

| User Role | Sections shown |
|---|---|
| BUYER | Active transactions (buying), Wallet balance, Quick payout button |
| SELLER | Active transactions (selling), Pending deliveries, Wallet balance |
| ADMIN/SUPPORT | Open disputes count, Pending resolutions, System stats |

**API calls on load (parallel):**
```typescript
forkJoin({
  wallet:       GET /wallet/balance,
  transactions: GET /escrow?status=LOCKED,SHIPPED&limit=5,
  disputes:     GET /disputes?status=OPEN&limit=3,
}).subscribe(...)
```

**Components:**
- `WalletBalanceCardComponent` — large balance display, "Retirer" CTA
- `TransactionSummaryCardComponent` — compact list item (ref, counterpart name, amount, status badge)
- `DisputeAlertBannerComponent` — shown if user has open disputes

---

## 9. Feature: Escrow Transactions

### 9.1 Transaction List

**Route:** `/escrow`
**Backend:** `GET /escrow` (paginated)

**Query params:** `?status=LOCKED,SHIPPED,DELIVERED&page=0&size=20&sort=createdAt,desc`

**UI:**
- Infinite scroll (no pagination numbers — mobile UX)
- Filter chips: `Tous | En attente | Livraison | Litiges`
- Pull-to-refresh
- Skeleton loader (3 card skeletons while loading)
- Empty state: illustration + "Aucune transaction"

**Transaction card layout:**
```
┌───────────────────────────────────────────┐
│ KT-2025-000123          [LOCKED badge]    │
│ Jean-Baptiste Fotso     12 500 XAF        │
│ Il y a 2 heures                     >    │
└───────────────────────────────────────────┘
```

### 9.2 Transaction Detail

**Route:** `/escrow/:id`
**Backend:** `GET /escrow/:id`

**Sections:**
1. **Status timeline** — visual stepper: INITIATED → LOCKED → SHIPPED → DELIVERED → RELEASED
2. **Amount breakdown** — Montant brut / Frais plateforme (3%) / Montant net vendeur
3. **Parties** — Acheteur & Vendeur with masked phone (+237 6XX XXX 789)
4. **Actions** — role-based:
  - BUYER + status=DELIVERED: "Scanner le QR code" button
  - SELLER + status=LOCKED: "Générer mon QR code" button
  - Any + status=LOCKED/SHIPPED: "Ouvrir un litige" button

### 9.3 QR Code Scan (Release Flow — Buyer)

**Route:** `/escrow/:id/scan`
**Backend:** `POST /escrow/:id/release`

This is the most critical mobile interaction — the buyer scans the seller's QR code to release funds.

```typescript
// Install: npm install zxing-browser
import { BrowserQRCodeReader } from '@zxing-browser/zxing-browser';

@Component({
  template: `
    <div class="scanner">
      <video #videoEl autoplay playsinline></video>
      <div class="scanner__overlay">
        <div class="scanner__frame"></div>
        <p>Placez le QR code dans le cadre</p>
      </div>
    </div>
  `
})
export class QrScannerComponent implements OnInit, OnDestroy {
  @ViewChild('videoEl') videoEl!: ElementRef<HTMLVideoElement>;

  private reader = new BrowserQRCodeReader();
  private scanning = false;

  async ngOnInit(): Promise<void> {
    // Request camera permission
    await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });

    this.scanning = true;
    const result = await this.reader.decodeOnceFromVideoDevice(
      undefined,       // auto-select back camera
      this.videoEl.nativeElement,
    );

    if (this.scanning) this.onScanned(result.getText());
  }

  private onScanned(verificationCode: string): void {
    this.scanning = false;
    // POST /escrow/:id/release { verificationCode }
    this.escrowService.release(this.transactionId, verificationCode).subscribe({
      next: () => this.router.navigate(['/escrow', this.transactionId]),
      error: () => { /* toast shown by error interceptor */ this.scanning = true; }
    });
  }

  ngOnDestroy(): void { this.scanning = false; }
}
```

**UX details:**
- Full-screen camera view
- Animated scanning frame (CSS animation)
- Permission denied state: show instructions to enable camera + deep link to settings
- After successful scan: loading overlay → success screen → redirect

### 9.4 QR Code Display (Seller)

**Route:** `/escrow/:id/qr`
**Backend:** `POST /escrow/:id/verification-code`

```typescript
// Install: npm install qrcode @types/qrcode
import QRCode from 'qrcode';

@Component({
  template: `
    <canvas #qrCanvas></canvas>
    <p class="hint">Montrez ce QR à l'acheteur pour confirmer la livraison</p>
    <button (click)="refresh()">Actualiser le code</button>
  `
})
export class QrDisplayComponent implements OnInit {
  @ViewChild('qrCanvas') canvas!: ElementRef<HTMLCanvasElement>;

  async ngOnInit(): Promise<void> {
    const { code } = await firstValueFrom(
      this.escrowService.generateVerificationCode(this.transactionId)
    );
    await QRCode.toCanvas(this.canvas.nativeElement, code, {
      width: 280,
      errorCorrectionLevel: 'H',
      color: { dark: '#0F172A', light: '#FFFFFF' },
    });
  }
}
```

**UX details:**
- QR code is large (minimum 280×280px — readable at arm's length)
- Show remaining validity countdown (TTL from server)
- "Actualiser" button regenerates the code
- Screen brightness auto-maximized when QR is displayed (`screen.orientation.lock`)

---

## 10. Feature: Disputes

### 10.1 Dispute Creation

**Route:** `/disputes/new?transactionId=KT-2025-000123`
**Backend:** `POST /disputes`

```typescript
interface CreateDisputeRequest {
  transactionId: string;
  reason:        'ITEM_NOT_RECEIVED' | 'ITEM_NOT_AS_DESCRIBED' | 'SELLER_NOT_RESPONDING' | 'OTHER';
  description:   string;  // min 20 chars, max 1000 chars
}
```

**Fields:**
- Transaction pre-filled from query param (read-only card showing amount + ref)
- Reason: radio group with icons (not a plain `<select>`)
- Description: `<textarea>` with character counter
- Evidence: optional file upload (photos, up to 5 files, 10MB each)
- Confirm: summary screen before final submit

**UX:**
- Multi-step form (3 steps): Raison → Description → Récapitulatif
- `ProgressStepperComponent` at top
- Prevent double-submit (disable button after first click)

### 10.2 Real-Time Dispute Chat

**Route:** `/disputes/:id`
**Backend:** STOMP `/topic/dispute.{id}` + `POST /disputes/:id/messages`

```typescript
interface DisputeMessage {
  id:        string;
  content:   string;
  authorId:  string;
  authorName:string;
  role:      string;
  createdAt: string;  // ISO 8601
  readBy:    string[];
}
```

**Layout (mobile-first, WhatsApp style):**
```
┌────────────────────────────────────────────┐
│ ← Litige #KT-2025-000123    [OPEN badge]   │ ← sticky header
├────────────────────────────────────────────┤
│                                            │
│  [bubble: vendeur]  Livraison effectuée.  │
│                                            │
│              [bubble: vous]  Non reçu.  ✓✓ │
│                                            │
│  [bubble: support]  Cas ouvert.           │
│                                            │
├────────────────────────────────────────────┤
│ [📎] [Type your message...]      [Send ▶]  │ ← sticky input
└────────────────────────────────────────────┘
```

**Implementation skeleton:**
```typescript
@Component({ /* ... */ })
export class DisputeChatComponent implements OnInit, OnDestroy {
  private sub!: StompSubscription;
  messages = signal<DisputeMessage[]>([]);
  typingUsers = signal<string[]>([]);
  private typingTimeout?: ReturnType<typeof setTimeout>;

  async ngOnInit(): Promise<void> {
    // Load history
    const history = await firstValueFrom(this.disputeService.getMessages(this.disputeId));
    this.messages.set(history);

    // Connect STOMP
    await this.stomp.connect();
    this.sub = this.stomp.subscribe(`/topic/dispute.${this.disputeId}`);

    this.stomp.on<DisputeMessage>(`/topic/dispute.${this.disputeId}`).subscribe(msg => {
      this.messages.update(m => [...m, msg]);
      this.scrollToBottom();
    });

    // Typing indicators
    this.stomp.on<{ userId: string; typing: boolean }>(
      `/topic/dispute.${this.disputeId}.typing`
    ).subscribe(({ userId, typing }) => {
      this.typingUsers.update(users =>
        typing ? [...new Set([...users, userId])] : users.filter(u => u !== userId)
      );
    });
  }

  sendTypingIndicator(): void {
    this.stomp.publish(`/app/dispute.${this.disputeId}.typing`, { typing: true });
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.stomp.publish(`/app/dispute.${this.disputeId}.typing`, { typing: false });
    }, 2000);
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }
}
```

**Features to implement:**
- [ ] Typing indicator ("Jean est en train d'écrire...")
- [ ] Read receipts (double checkmark ✓✓)
- [ ] Virtual scroll for long history (CDK `ScrollingModule`)
- [ ] Auto-scroll to bottom on new message
- [ ] Scroll-to-bottom FAB when user scrolls up
- [ ] Optimistic updates (add message instantly, remove on error)
- [ ] Image preview for evidence attachments

### 10.3 Evidence Upload

**Backend:** `POST /disputes/:id/evidence` (multipart/form-data)

```typescript
uploadEvidence(disputeId: string, files: File[]): Observable<void> {
  const form = new FormData();
  files.forEach(f => form.append('files', f, f.name));
  return this.http.post<void>(
    this.url(`/disputes/${disputeId}/evidence`),
    form,
    { ...this.defaultOptions, reportProgress: true, observe: 'events' }
  );
}
```

**UX:**
- Drag-and-drop zone (desktop) / tap-to-pick (mobile, `accept="image/*,application/pdf"`)
- Preview thumbnails with delete button
- Upload progress bar per file
- Size validation client-side (max 10 MB per file, max 5 files)
- File type validation: images + PDF only

### 10.4 Dispute Resolution (Admin/Support)

**Route:** `/admin/disputes/:id`
**Backend:** `POST /disputes/:id/resolve`

```typescript
interface ResolveDisputeRequest {
  resolution:    'FULL_REFUND_BUYER' | 'RELEASE_TO_SELLER' | 'PARTIAL_REFUND_BUYER' | 'SPLIT_50_50' | 'NO_ACTION';
  claimedAmount?: number;  // required for PARTIAL_REFUND_BUYER
  notes:          string;  // internal only, not shown to parties
}
```

**UI:**
- Dispute detail panel (messages, evidence viewer)
- Resolution picker with financial impact preview:
  ```
  FULL_REFUND_BUYER: Acheteur récupère 50 000 XAF | Vendeur: 0 XAF
  RELEASE_TO_SELLER: Acheteur: 0 XAF | Vendeur récupère 48 500 XAF (- frais 3%)
  ```
- Internal notes textarea (not visible to buyer/seller)
- Confirmation modal with impact summary before submit

---

## 11. Feature: Payouts

### 11.1 Request Payout

**Route:** `/payouts/new`
**Backend:** `POST /payouts`

```typescript
interface PayoutRequest {
  amount:   number;         // min 500 XAF
  provider: 'CAMPAY' | 'MONETBIL';
  phone:    string;         // recipient mobile money number
}
```

**UX:**
- Current wallet balance shown prominently
- Amount input with quick-select buttons: 5 000 · 10 000 · 50 000 · Tout
- Provider picker: Campay / Monetbil with their logos
- Phone pre-filled from user profile (editable)
- Fee preview: "Frais estimés: 250 XAF → Vous recevrez: 49 750 XAF"

### 11.2 OTP Verification

**Multi-step flow:**

```
Step 1: POST /payouts           → { payoutId }
Step 2: POST /payouts/:id/otp   → OTP sent to phone
Step 3: User enters OTP (PinInputComponent)
Step 4: POST /payouts/:id/submit { otp }
         → Payout processing → redirect to payout status page
```

**`PinInputComponent`:**
- 6-cell numeric-only input
- Mobile keyboard type: `inputmode="numeric"` + `pattern="[0-9]*"`
- Auto-submit at 6 digits
- Resend OTP button (visible after 60s countdown)
- Remaining attempts indicator

---

## 12. Feature: Profile & Settings

**Routes under `/profile`:**

| Route | Component | Description |
|---|---|---|
| `/profile` | `ProfileHomeComponent` | Name, avatar, verified badges |
| `/profile/security` | `SecuritySettingsComponent` | MFA status, password change |
| `/profile/security/mfa` | `MfaSetupComponent` | Enable/disable TOTP |
| `/profile/kyc` | `KycStatusComponent` | ID verification status (future) |
| `/profile/notifications` | `NotificationsComponent` | Push notification preferences |

**MFA toggle flow:**
- MFA disabled: "Activer la 2FA" → `MfaSetupComponent`
- MFA enabled: "Désactiver la 2FA" → prompt for current TOTP code → `DELETE /mfa/disable`

---

## 13. Feature: Wallet

**Route:** `/wallet`
**Backend:** `GET /wallet` + `GET /wallet/movements?page=0&size=20`

```typescript
interface WalletBalance {
  balance:      number;  // available
  frozenAmount: number;  // locked in escrow
  currency:     'XAF';
}

interface WalletMovement {
  id:          string;
  type:        'FREEZE' | 'RELEASE' | 'CREDIT' | 'DEBIT' | 'REFUND';
  amount:      number;
  balanceBefore: number;
  balanceAfter:  number;
  reference:   string;   // "KT-2025-000123"
  description: string;
  createdAt:   string;
}
```

**Layout:**
```
┌─────────────────────────────────┐
│        Solde disponible         │
│          125 000 XAF            │
│      Bloqué: 50 000 XAF         │
│  [Retirer]          [Actualiser]│
└─────────────────────────────────┘
│
│ Historique des mouvements
│  ─────────────────────────
│  ▲ +50 000 XAF  KT-2025-001   2h
│  ▼ -12 500 XAF  Retrait       1j
│  ▲  +5 000 XAF  KT-2025-002   3j
```

**UX:**
- Balance hidden by default (eye icon toggle) — privacy on shared screens
- Color coding: green for credits, red for debits
- Infinite scroll on movements
- Tap movement → detail bottom sheet

---

## 14. Shared Components

### Components to Build

#### `OtpInputComponent`
```typescript
// 6 individual input cells with auto-advance and paste support
@Component({
  selector: 'app-otp-input',
  inputs: ['length', 'disabled'],
  outputs: ['completed'],
  // Each cell: maxlength=1, inputmode=numeric
  // Paste: split string → fill cells sequentially
  // Backspace: focus previous cell
})
```

#### `AmountDisplayComponent`
```typescript
// "50 000 XAF" formatted according to West African convention
@Pipe({ name: 'amount' })
export class AmountPipe implements PipeTransform {
  transform(value: number, currency = 'XAF'): string {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(value);
    // → "50 000 XAF"
  }
}
```

#### `StatusBadgeComponent`
```typescript
// Maps TransactionStatus → color + label (in French)
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  INITIATED:  { label: 'Initié',    color: 'gray'   },
  LOCKED:     { label: 'Bloqué',    color: 'blue'   },
  SHIPPED:    { label: 'Expédié',   color: 'yellow' },
  DELIVERED:  { label: 'Livré',     color: 'green'  },
  RELEASED:   { label: 'Libéré',    color: 'teal'   },
  DISPUTED:   { label: 'Litigieux', color: 'red'    },
  REFUNDED:   { label: 'Remboursé', color: 'purple' },
};
```

#### `LoadingSkeletonComponent`
- Never use spinners for list content — always skeleton screens
- Card skeleton: gray animated gradient, matching the real card dimensions
- Use `@defer` with `on idle` for non-critical sections

#### `BottomSheetComponent`
```typescript
// Mobile action sheet (swipe down to dismiss)
// Uses Angular CDK OverlayModule
// Animation: slide up from bottom (350ms ease-out)
// Backdrop: semi-transparent, tap to dismiss
// Swipe-to-close: detect swipe velocity > 300px/s
```

---

## 15. Mobile-First Responsive Strategy

### Breakpoints

```scss
// _breakpoints.scss
$bp: (xs: 360px, sm: 480px, md: 768px, lg: 1024px, xl: 1280px);

@mixin up($size) {
  @media (min-width: map.get($bp, $size)) { @content; }
}
```

### Touch UX Rules

| Rule | Implementation |
|---|---|
| Min touch target 44×44px | `min-height: var(--touch-target)` on all interactive elements |
| Thumb-zone awareness | Primary actions in bottom 40% of screen |
| No hover-only affordances | All hover states must have active/focus equivalents |
| Swipe gestures | Swipe left on list items → contextual actions |
| No horizontal scroll | `overflow-x: hidden` on all containers |
| Large type in inputs | `font-size: 16px` minimum to prevent iOS zoom |

### Angular CDK Integration

```bash
npm install @angular/cdk
```

Use:
- `BreakpointObserver` — detect screen size reactively
- `OverlayModule` — bottom sheets, dialogs
- `ScrollingModule` — virtual scroll for long lists (transactions, movements)
- `A11yModule` — focus trap in modals, live announcer for screen readers

---

## 16. PWA Configuration

**`ngsw-config.json`:**
```json
{
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app-shell",
      "installMode": "prefetch",
      "updateMode": "prefetch",
      "resources": {
        "files": ["/favicon.ico", "/index.html", "/manifest.webmanifest",
                  "/*.css", "/*.js"]
      }
    },
    {
      "name": "assets",
      "installMode": "lazy",
      "updateMode": "prefetch",
      "resources": {
        "files": ["/assets/**", "/*.(svg|png|jpg|webp|woff2)"]
      }
    }
  ],
  "dataGroups": [
    {
      "name": "user-session",
      "urls": ["/bff/auth/me"],
      "cacheConfig": { "strategy": "freshness", "maxAge": "30m", "timeout": "5s", "maxSize": 1 }
    },
    {
      "name": "api-data",
      "urls": ["/escrow/**", "/wallet/**", "/disputes/**"],
      "cacheConfig": { "strategy": "performance", "maxAge": "2m", "maxSize": 100 }
    }
  ]
}
```

**App install prompt:**
```typescript
// Listen for beforeinstallprompt and show custom install banner
// on the dashboard after 3 visits
```

**`manifest.webmanifest`:**
```json
{
  "name": "Katika — Paiements Sécurisés",
  "short_name": "Katika",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#FFFFFF",
  "theme_color": "#1A56DB",
  "orientation": "portrait",
  "icons": [
    { "src": "assets/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "assets/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

---

## 17. Performance for Low-Bandwidth Networks

West African mobile networks can be 2G/3G with high latency. These optimizations are non-negotiable.

| Technique | Implementation |
|---|---|
| **Initial bundle < 150 KB** | All features lazy-loaded, `@defer` for heavy components |
| **Image optimization** | WebP format, `loading="lazy"`, `srcset` with 1x/2x |
| **No layout shift** | Skeleton screens sized to match real content |
| **Preload on hover/focus** | `prefetch` strategy on route links |
| **HTTP/2 push** | Configure Nginx to push critical CSS |
| **Brotli compression** | Nginx `brotli_comp_level 6` |
| **Cache API data** | Service worker caches GET /escrow and /wallet for 2 minutes |
| **Request deduplication** | `shareReplay(1)` on active fetches |
| **Pagination size** | Default page size: 20 (not 100) |
| **Optimistic UI** | Add message/action to list before server confirms |
| **Connection-aware loading** | Check `navigator.connection.effectiveType` and reduce image quality on 2G |

```typescript
// Connection-aware image quality
const conn = (navigator as any).connection;
const quality = conn?.effectiveType === '2g' ? 'low' : 'high';
```

---

## 18. Testing

### Unit Tests (Jest via @angular-builders/jest)

```bash
npm install -D jest @angular-builders/jest @types/jest
```

**What to test:**
- `AuthStore` — state transitions (login, MFA, logout)
- Interceptors — CSRF header, 401 → refresh, offline detection
- `AmountPipe`, `PhoneInputComponent` — formatting correctness
- Route guards — authenticated/unauthenticated redirects
- Service methods — API call shapes (use `HttpTestingController`)

**Example store test:**
```typescript
describe('AuthStore', () => {
  it('sets mfaRequired when server responds with mfaRequired:true', () => {
    TestBed.configureTestingModule({ providers: [AuthStore, mockAuthService] });
    const store = TestBed.inject(AuthStore);
    store.login({ username: '+237600000001', password: 'Pass@word1' });
    // assert store.mfaRequired() === true
  });
});
```

### Component Tests (Angular Testing Library)

```bash
npm install -D @testing-library/angular @testing-library/user-event
```

Focus on critical user flows:
- Login form → submit → loading state → redirect
- OTP input → auto-advance → paste support
- QR scanner → permission denied state
- Dispute chat → message appears after send

### E2E Tests (Playwright)

```bash
npm install -D @playwright/test
npx playwright install chromium  # mobile emulation
```

**Critical paths to test:**
1. Register → Login → Enable MFA → Login with MFA
2. Dashboard loads with correct balance
3. Buyer scans QR → transaction moves to RELEASED
4. Create dispute → send message → support resolves
5. Request payout → enter OTP → confirm

```typescript
// playwright.config.ts
export default {
  projects: [
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 15'] } },
  ],
};
```

---

## 19. Build & CI/CD

**Production build:**
```bash
ng build --configuration=production

# Output: dist/katika-web/browser/
# - main.[hash].js         ← app bundle (gzipped < 150KB target)
# - vendor.[hash].js       ← Angular framework
# - ngsw-worker.js         ← Service worker
# - index.html
```

**`angular.json` production optimizations:**
```json
{
  "optimization": {
    "scripts": true,
    "styles": { "minify": true, "inlineCritical": true },
    "fonts": { "inline": true }
  },
  "outputHashing": "all",
  "sourceMap": false,
  "namedChunks": false,
  "budgets": [
    { "type": "initial",       "maximumWarning": "500kb", "maximumError": "1mb" },
    { "type": "anyComponentStyle", "maximumWarning": "4kb" }
  ]
}
```

**CI pipeline (`github-actions.yml`):**
```yaml
jobs:
  build-and-test:
    steps:
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: npm ci
      - run: npm run lint
      - run: npm run test:ci           # Jest with coverage
      - run: npm run build:prod        # Production build
      - run: npx playwright test       # E2E (against local API mock)
      - run: npm audit --audit-level=high  # Security audit
```

**Nginx serving (production):**
```nginx
server {
  root /usr/share/nginx/html;
  index index.html;

  # SPA routing — all routes → index.html
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Cache static assets forever (they have content hashes in filenames)
  location ~* \.(js|css|png|svg|woff2|webp)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  # Never cache index.html (always fetch fresh)
  location = /index.html {
    add_header Cache-Control "no-store, no-cache, must-revalidate";
  }

  # Never cache service worker
  location = /ngsw-worker.js {
    add_header Cache-Control "no-store";
  }

  # Proxy API to backend
  location /bff/ {
    proxy_pass http://katika-api:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # Security headers
  add_header X-Frame-Options "DENY";
  add_header X-Content-Type-Options "nosniff";
  add_header Referrer-Policy "strict-origin-when-cross-origin";
  add_header Content-Security-Policy "default-src 'self'; connect-src 'self' wss://api.katika.cm; img-src 'self' data: blob:; font-src 'self'; style-src 'self' 'unsafe-inline'";
  add_header Permissions-Policy "camera=(self), microphone=(), geolocation=()";
}
```

---

## 20. API Contract Reference

All calls use `withCredentials: true`. Base URL: `environment.apiUrl`.

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| GET | `/bff/auth/csrf` | None | — | Sets XSRF-TOKEN cookie |
| POST | `/bff/auth/login` | None | `{username, password}` | `{mfaRequired, challengeToken?, user?}` |
| POST | `/bff/auth/mfa/verify` | None | `{code, challengeToken}` | `UserProfile` |
| POST | `/bff/auth/refresh` | Cookie | — | Rotates cookies |
| POST | `/bff/auth/logout` | Cookie | — | Clears cookies |
| GET | `/bff/auth/me` | Cookie | — | `UserProfile` |
| POST | `/auth/register` | None | `RegisterRequest` | `{userId}` |
| GET | `/mfa/status` | JWT | — | `{enabled: boolean}` |
| GET | `/mfa/setup` | JWT | — | `{qrCodeUri, backupCodes[]}` |
| POST | `/mfa/confirm` | JWT | `{code}` | `{enabled: true}` |
| POST | `/mfa/disable` | JWT | `{code}` | `{enabled: false}` |
| GET | `/escrow` | JWT | — | `Page<TransactionSummary>` |
| GET | `/escrow/:id` | JWT | — | `TransactionDetail` |
| POST | `/escrow/:id/verification-code` | JWT | — | `{code, qrUri, expiresAt}` |
| POST | `/escrow/:id/release` | JWT | `{verificationCode}` | `TransactionDetail` |
| GET | `/wallet` | JWT | — | `WalletBalance` |
| GET | `/wallet/movements` | JWT | — | `Page<WalletMovement>` |
| POST | `/payouts` | JWT | `PayoutRequest` | `{payoutId}` |
| POST | `/payouts/:id/otp` | JWT | — | `{expiresAt}` |
| POST | `/payouts/:id/submit` | JWT | `{otp}` | `{status: PROCESSING}` |
| GET | `/disputes` | JWT | — | `Page<DisputeSummary>` |
| GET | `/disputes/:id` | JWT | — | `DisputeDetail` |
| POST | `/disputes` | JWT | `CreateDisputeRequest` | `DisputeDetail` |
| POST | `/disputes/:id/evidence` | JWT | `FormData` (files) | `{evidenceId}` |
| POST | `/disputes/:id/resolve` | JWT (SUPPORT+) | `ResolveDisputeRequest` | `DisputeDetail` |

**WebSocket subscriptions:**

| Destination | Direction | Payload |
|---|---|---|
| `/topic/dispute.{id}` | Subscribe | `DisputeMessage` |
| `/topic/dispute.{id}.typing` | Subscribe | `{userId, typing}` |
| `/topic/dispute.{id}.internal` | Subscribe (SUPPORT+) | `InternalNote` |
| `/app/dispute.{id}.message` | Publish | `{content}` |
| `/app/dispute.{id}.typing` | Publish | `{typing: boolean}` |

---

> **Localization note:** All user-visible strings should be in French (Cameroon). Use `@angular/localize` for i18n. Date formatting: `dd/MM/yyyy`. Currency: XAF (CFA franc) with space as thousands separator.
