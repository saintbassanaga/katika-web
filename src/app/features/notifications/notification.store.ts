import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { NotificationService } from './notification.service';

export const NotificationStore = signalStore(
  { providedIn: 'root' },
  withState({ unreadCount: 0 }),
  withMethods((store, svc = inject(NotificationService)) => ({
    loadUnreadCount(): void {
      svc.getUnreadCount().subscribe(r => patchState(store, { unreadCount: r.count }));
    },
    decrement(): void {
      patchState(store, { unreadCount: Math.max(0, store.unreadCount() - 1) });
    },
    resetCount(): void {
      patchState(store, { unreadCount: 0 });
    },
  })),
);
