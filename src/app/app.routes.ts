import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  {
    path: 'dashboard',
    canActivate:[authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'escrow',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/escrow/escrow.routes').then(m => m.ESCROW_ROUTES),
  },
  {
    path: 'disputes',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/disputes/disputes.routes').then(m => m.DISPUTE_ROUTES),
  },
  {
    path: 'payouts',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/payouts/payouts.routes').then(m => m.PAYOUT_ROUTES),
  },
  {
    path: 'wallet',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/wallet/wallet.component').then(m => m.WalletComponent),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES),
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard('ADMIN', 'SUPERVISOR')],
    loadChildren: () =>
      import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
  },
  {
    path: '403',
    loadComponent: () =>
      import('./shared/components/forbidden/forbidden.component').then(m => m.ForbiddenComponent),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
];
