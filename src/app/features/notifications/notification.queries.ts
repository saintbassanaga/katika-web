import { inject } from '@angular/core';
import {
  injectMutation,
  injectQuery,
  injectQueryClient,
} from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { NotificationService } from './notification.service';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (page: number, size: number) => [...notificationKeys.lists(), { page, size }] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function injectNotificationsQuery(page = 0, size = 20) {
  const service = inject(NotificationService);
  return injectQuery(() => ({
    queryKey: notificationKeys.list(page, size),
    queryFn: () => firstValueFrom(service.getNotifications(page, size)),
  }));
}

export function injectUnreadCountQuery() {
  const service = inject(NotificationService);
  return injectQuery(() => ({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => firstValueFrom(service.getUnreadCount()),
    refetchInterval: 1000 * 30, // rafraîchir toutes les 30s
  }));
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function injectMarkAsReadMutation() {
  const service = inject(NotificationService);
  const queryClient = injectQueryClient();
  return injectMutation(() => ({
    mutationFn: (id: string) => firstValueFrom(service.markAsRead(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  }));
}

export function injectMarkAllAsReadMutation() {
  const service = inject(NotificationService);
  const queryClient = injectQueryClient();
  return injectMutation(() => ({
    mutationFn: () => firstValueFrom(service.markAllAsRead()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  }));
}
