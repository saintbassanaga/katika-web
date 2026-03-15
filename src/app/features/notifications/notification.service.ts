import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/http/api.service';
import { AppNotificationResponse, Page } from '@shared/models/model';

@Injectable({ providedIn: 'root' })
export class NotificationService extends ApiService {

  getNotifications(page = 0, size = 20): Observable<Page<AppNotificationResponse>> {
    return this.http.get<Page<AppNotificationResponse>>(
      this.url(`/api/notifications?page=${page}&size=${size}`),
      this.defaultOptions,
    );
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(
      this.url('/api/notifications/unread-count'),
      this.defaultOptions,
    );
  }

  markAsRead(id: string): Observable<AppNotificationResponse> {
    return this.http.patch<AppNotificationResponse>(
      this.url(`/api/notifications/${id}/read`),
      {},
      this.defaultOptions,
    );
  }

  markAllAsRead(): Observable<void> {
    return this.http.patch<void>(
      this.url('/api/notifications/read-all'),
      {},
      this.defaultOptions,
    );
  }
}
