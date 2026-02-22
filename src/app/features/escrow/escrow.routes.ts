import { Routes } from '@angular/router';

export const ESCROW_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/transaction-list.component').then(m => m.TransactionListComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./detail/transaction-detail.component').then(m => m.TransactionDetailComponent),
  },
  {
    path: ':id/scan',
    loadComponent: () => import('./qr-scan/qr-scan.component').then(m => m.QrScanComponent),
  },
  {
    path: ':id/qr',
    loadComponent: () => import('./qr-display/qr-display.component').then(m => m.QrDisplayComponent),
  },
];
