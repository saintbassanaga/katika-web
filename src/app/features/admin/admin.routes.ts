import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
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
];
