import { Routes } from '@angular/router';

export const DISPUTE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/dispute-list.component').then(m => m.DisputeListComponent),
  },
  {
    path: 'new',
    loadComponent: () => import('./create/dispute-create.component').then(m => m.DisputeCreateComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./chat/dispute-chat.component').then(m => m.DisputeChatComponent),
  },
];
