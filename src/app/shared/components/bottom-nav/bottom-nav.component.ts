import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthStore } from '@core/auth/auth.store';
import { NotificationStore } from '@features/notifications/notification.store';
import { NavItem } from '@shared/models/model';

const USER_NAV: NavItem[] = [
  { key: 'home',          route: '/dashboard'     },
  { key: 'escrow',        route: '/escrow'        },
  { key: 'disputes',      route: '/disputes'      },
  { key: 'payouts',       route: '/payouts'       },
  { key: 'notifications', route: '/notifications' },
];

const ADMIN_NAV: NavItem[] = [
  { key: 'adminHome',     route: '/admin/dashboard' },
  { key: 'adminDisputes', route: '/admin/disputes'  },
  { key: 'adminUsers',    route: '/admin/users'     },
  { key: 'notifications', route: '/notifications'   },
];

const STAFF_ROLES = new Set(['ADMIN', 'SUPERVISOR', 'SUPPORT']);

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  styles: [':host { display: block; }'],
  template: `
    <nav class="fixed bottom-0 left-0 right-0 z-50 bg-white/[.88] backdrop-blur-[16px] backdrop-saturate-[180%] border-t border-slate-200/80 safe-area-bottom" aria-label="Navigation principale">
      <div class="flex items-stretch h-[60px]">
        @for (item of navItems(); track item.route) {
          <a [routerLink]="item.route"
             routerLinkActive="nav-active"
             class="flex-1 flex flex-col items-center justify-center gap-[3px] text-slate-400 no-underline transition-colors relative min-h-[44px] hover:text-slate-500 [&.nav-active]:text-primary"
             [attr.aria-label]="'nav.' + item.key | translate">
            <div class="nav-icon w-9 h-7 flex items-center justify-center rounded-[10px] transition-colors [.nav-active_&]:bg-primary/10">
              @switch (item.key) {
                @case ('home') {
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                }
                @case ('escrow') {
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4"/>
                  </svg>
                }
                @case ('disputes') {
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                }
                @case ('payouts') {
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M16 12l-4-4-4 4M12 16V8"/>
                  </svg>
                }
                @case ('profile') {
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                }
                @case ('adminHome') {
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                  </svg>
                }
                @case ('adminDisputes') {
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                }
                @case ('adminUsers') {
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                  </svg>
                }
                @case ('notifications') {
                  <div class="relative">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
                    </svg>
                    @if (notifStore.unreadCount() > 0) {
                      <span class="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center leading-none">
                        {{ notifStore.unreadCount() > 9 ? '9+' : notifStore.unreadCount() }}
                      </span>
                    }
                  </div>
                }
              }
            </div>
            <span class="text-[.625rem] font-semibold tracking-[.02em]">{{ 'nav.' + item.key | translate }}</span>
          </a>
        }
      </div>
    </nav>
  `,
})
export class BottomNavComponent implements OnInit {
  private readonly auth       = inject(AuthStore);
  protected readonly notifStore = inject(NotificationStore);

  ngOnInit(): void {
    this.notifStore.loadUnreadCount();
  }

  protected navItems() {
    return STAFF_ROLES.has(this.auth.role() ?? '') ? ADMIN_NAV : USER_NAV;
  }
}
