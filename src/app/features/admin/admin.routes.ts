import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'disputes',
    pathMatch: 'full',
  },
  {
    path: 'disputes',
    loadComponent: () => import('./dispute-resolution/dispute-resolution.component').then(m => m.DisputeResolutionComponent),
  },
  {
    path: 'disputes/:id',
    loadComponent: () => import('./dispute-resolution/dispute-resolution.component').then(m => m.DisputeResolutionComponent),
  },
];
