import { Routes } from '@angular/router';
import { roleGuard } from '@core/auth/role.guard';
import { desktopGuard } from '@core/guards/desktop.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    canActivate: [desktopGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
      },
      {
        path: 'disputes',
        loadComponent: () => import('./dispute-list/admin-dispute-list.component').then(m => m.AdminDisputeListComponent),
      },
      {
        path: 'disputes/:id',
        loadComponent: () => import('./dispute-detail/admin-dispute-detail.component').then(m => m.AdminDisputeDetailComponent),
      },
      {
        path: 'users',
        canActivate: [roleGuard('ADMIN', 'SUPERVISOR')],
        loadComponent: () => import('./users/admin-users.component').then(m => m.AdminUsersComponent),
      },
      {
        path: 'transactions',
        canActivate: [roleGuard('ADMIN', 'SUPERVISOR')],
        loadComponent: () => import('./transactions/admin-transactions.component').then(m => m.AdminTransactionsComponent),
      },
    ],
  },
];
