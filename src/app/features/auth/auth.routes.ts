import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'mfa-verify',
    loadComponent: () =>
      import('./mfa-verify/mfa-verify.component').then(m => m.MfaVerifyComponent),
  },
  {
    path: 'mfa-setup',
    loadComponent: () =>
      import('./mfa-setup/mfa-setup.component').then(m => m.MfaSetupComponent),
  },
];
