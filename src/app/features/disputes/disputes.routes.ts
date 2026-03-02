import { Routes } from '@angular/router';

export const DISPUTE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/dispute-list.component').then(m => m.DisputeListComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./chat/dispute-chat.component').then(m => m.DisputeChatComponent),
  },
];
