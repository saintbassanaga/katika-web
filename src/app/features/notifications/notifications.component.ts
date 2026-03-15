import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { NotificationService } from './notification.service';
import { NotificationStore } from './notification.store';
import { AuthStore } from '@core/auth/auth.store';
import { ToastService } from '@core/notification/toast.service';
import { AppNotificationResponse, NotificationType } from '@shared/models/model';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';

const STAFF_ROLES = new Set(['ADMIN', 'SUPERVISOR', 'SUPPORT']);

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [RouterLink, TimeAgoPipe, TranslatePipe],
  template: `
    <div class="animate-fade flex flex-col min-h-full bg-page">

      <!-- Topbar -->
      <div class="sticky top-0 z-20 bg-dark shadow-[0_2px_12px_rgba(15,23,42,.25)] px-4 md:px-8 py-3 flex items-center gap-3">
        <a [routerLink]="backRoute()"
           class="w-9 h-9 rounded-[10px] bg-white/10 flex items-center justify-center text-white/80 no-underline shrink-0 transition-colors hover:bg-white/20">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </a>
        <div class="flex-1 min-w-0">
          <h1 class="text-sm font-bold text-white m-0">{{ 'notifications.title' | translate }}</h1>
          @if (unreadCount() > 0) {
            <p class="text-xs text-white/50 m-0">{{ unreadCount() }} {{ 'notifications.unreadSuffix' | translate }}</p>
          }
        </div>
        @if (hasUnread()) {
          <button
            (click)="markAllAsRead()"
            [disabled]="markingAll()"
            class="px-3 py-1.5 rounded-lg bg-white/10 text-white/80 text-xs font-semibold border-none cursor-pointer transition-colors hover:bg-white/20 disabled:opacity-40"
          >
            @if (markingAll()) {
              <span class="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block mr-1"></span>
            }
            {{ 'notifications.markAllRead' | translate }}
          </button>
        }
      </div>

      <!-- Content -->
      <div class="flex-1 max-w-2xl mx-auto w-full px-4 md:px-8 py-3 pb-24 md:pb-8">

        @if (loading()) {
          <div class="flex flex-col gap-2">
            @for (i of [1,2,3,4,5,6]; track i) {
              <div class="bg-white rounded-2xl p-4 flex gap-3 shadow-sm">
                <div class="skeleton-shimmer w-10 h-10 rounded-full shrink-0"></div>
                <div class="flex-1 space-y-1.5">
                  <div class="skeleton-shimmer h-3 w-1/2 rounded"></div>
                  <div class="skeleton-shimmer h-2.5 w-3/4 rounded"></div>
                  <div class="skeleton-shimmer h-2 w-1/4 rounded mt-1"></div>
                </div>
              </div>
            }
          </div>

        } @else if (notifications().length === 0) {
          <div class="flex flex-col items-center justify-center py-24 text-center">
            <div class="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center text-4xl mb-4">🔔</div>
            <p class="text-base font-bold text-slate-900 m-0 mb-1">{{ 'notifications.empty' | translate }}</p>
            <p class="text-sm text-slate-400 m-0">{{ 'notifications.emptySub' | translate }}</p>
          </div>

        } @else {
          <div class="flex flex-col gap-1.5">
            @for (n of notifications(); track n.id) {
              <button
                (click)="onTap(n)"
                class="w-full text-left flex items-start gap-3.5 rounded-2xl px-4 py-3.5 border-none cursor-pointer font-[inherit] transition-all"
                [class]="n.read
                  ? 'bg-white shadow-[0_1px_4px_rgba(15,23,42,.05)] hover:shadow-[0_4px_16px_rgba(15,23,42,.08)]'
                  : 'bg-primary/[.04] shadow-[0_1px_4px_rgba(27,79,138,.08)] hover:shadow-[0_4px_16px_rgba(27,79,138,.12)] border border-primary/10'"
              >
                <!-- Icon -->
                <div class="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-lg relative"
                     [class]="notifIconBg(n.type)">
                  {{ notifEmoji(n.type) }}
                  @if (!n.read) {
                    <span class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white"></span>
                  }
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2">
                    <p class="text-sm m-0 leading-snug"
                       [class]="n.read ? 'font-medium text-slate-700' : 'font-bold text-slate-900'">
                      {{ n.title }}
                    </p>
                    <span class="text-[10px] text-slate-400 shrink-0 mt-0.5">{{ n.createdAt | timeAgo }}</span>
                  </div>
                  <p class="text-xs text-slate-500 m-0 mt-0.5 leading-relaxed">{{ n.body }}</p>
                  @if (n.entityReference) {
                    <span class="inline-block mt-1.5 text-[10px] font-semibold text-primary bg-primary/[.07] px-2 py-0.5 rounded-full">
                      {{ n.entityReference }}
                    </span>
                  }
                </div>
              </button>
            }

            @if (hasMore()) {
              <button
                (click)="loadMore()"
                [disabled]="loadingMore()"
                class="w-full py-3 mt-1 border border-slate-200 rounded-xl text-sm text-slate-500 hover:bg-slate-50 transition-colors bg-white"
              >
                @if (loadingMore()) { {{ 'common.loading' | translate }} } @else { {{ 'common.loadMore' | translate }} }
              </button>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class NotificationsComponent implements OnInit {
  private readonly svc       = inject(NotificationService);
  private readonly notifStore = inject(NotificationStore);
  private readonly auth      = inject(AuthStore);
  private readonly router    = inject(Router);
  private readonly toast     = inject(ToastService);
  private readonly translate = inject(TranslateService);

  protected readonly notifications = signal<AppNotificationResponse[]>([]);
  protected readonly loading       = signal(true);
  protected readonly loadingMore   = signal(false);
  protected readonly hasMore       = signal(false);
  protected readonly markingAll    = signal(false);

  protected readonly unreadCount = this.notifStore.unreadCount;

  private page = 0;

  protected hasUnread() {
    return this.notifications().some(n => !n.read);
  }

  protected backRoute() {
    return STAFF_ROLES.has(this.auth.role() ?? '') ? '/admin/dashboard' : '/dashboard';
  }

  ngOnInit(): void { this.load(); }

  protected loadMore(): void {
    this.page++;
    this.loadingMore.set(true);
    this.fetch(false);
  }

  private load(): void {
    this.loading.set(true);
    this.fetch(true);
  }

  private fetch(reset: boolean): void {
    this.svc.getNotifications(this.page).subscribe({
      next: (data) => {
        this.notifications.update(n => reset ? data.content : [...n, ...data.content]);
        this.hasMore.set(this.page < data.totalPages - 1);
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: () => { this.loading.set(false); this.loadingMore.set(false); },
    });
  }

  protected onTap(n: AppNotificationResponse): void {
    if (!n.read) {
      this.svc.markAsRead(n.id).subscribe({
        next: (updated) => {
          this.notifications.update(list => list.map(x => x.id === updated.id ? updated : x));
          this.notifStore.decrement();
        },
      });
    }
    const route = this.entityRoute(n);
    if (route) this.router.navigate(route);
  }

  protected markAllAsRead(): void {
    if (this.markingAll()) return;
    this.markingAll.set(true);
    this.svc.markAllAsRead().subscribe({
      next: () => {
        this.notifications.update(list => list.map(n => ({ ...n, read: true })));
        this.notifStore.resetCount();
        this.markingAll.set(false);
        this.toast.success(this.translate.instant('notifications.allReadToast'));
      },
      error: () => this.markingAll.set(false),
    });
  }

  private entityRoute(n: AppNotificationResponse): string[] | null {
    if (!n.entityId) return null;
    const isStaff = STAFF_ROLES.has(this.auth.role() ?? '');

    if (n.type.startsWith('ESCROW'))  return [isStaff ? '/admin' : '/escrow', ...(isStaff ? [] : [n.entityId])];
    if (n.type.startsWith('PAYOUT'))  return ['/payouts'];
    return null;
  }

  protected notifIconBg(type: NotificationType): string {
    if (type.startsWith('ESCROW'))       return 'bg-indigo-100';
    if (type.startsWith('PAYOUT'))       return 'bg-green-100';
    if (type.startsWith('VERIFICATION')) return 'bg-amber-100';
    return 'bg-slate-100';
  }

  protected notifEmoji(type: NotificationType): string {
    if (type.startsWith('ESCROW'))       return '🔒';
    if (type.startsWith('PAYOUT'))       return '💸';
    if (type.startsWith('VERIFICATION')) return '✅';
    return '🔔';
  }
}
