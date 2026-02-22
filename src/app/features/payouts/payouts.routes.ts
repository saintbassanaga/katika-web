import { Routes } from '@angular/router';

export const PAYOUT_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'new',
    pathMatch: 'full',
  },
  {
    path: 'new',
    loadComponent: () => import('./new/payout-new.component').then(m => m.PayoutNewComponent),
  },
  {
    path: ':id/otp',
    loadComponent: () => import('./otp/payout-otp.component').then(m => m.PayoutOtpComponent),
  },
];
