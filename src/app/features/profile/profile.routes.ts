import { Routes } from '@angular/router';

export const PROFILE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/profile-home.component').then(m => m.ProfileHomeComponent),
  },
  {
    path: 'security',
    loadComponent: () => import('./security/security-settings.component').then(m => m.SecuritySettingsComponent),
  },
  {
    path: 'security/mfa',
    loadComponent: () => import('../../features/auth/mfa-setup/mfa-setup.component').then(m => m.MfaSetupComponent),
  },
];
