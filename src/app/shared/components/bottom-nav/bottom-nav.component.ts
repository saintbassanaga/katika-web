import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TuiIcon } from '@taiga-ui/core';
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
  imports: [RouterLink, RouterLinkActive, TuiIcon, TranslatePipe],
  styles: [':host { display: block; }'],
  template: `
    <nav class="fixed bottom-0 left-0 right-0 z-50 bg-white/[.88] backdrop-blur-[16px] backdrop-saturate-[180%] border-t border-slate-200/80 safe-area-bottom" aria-label="Navigation principale">
      <div class="flex items-stretch h-[60px]">
        @for (item of navItems(); track item.route) {
          <a [routerLink]="item.route"
             routerLinkActive="nav-active"
             class="flex-1 flex flex-col items-center justify-center gap-[3px] text-slate-400 no-underline transition-colors relative min-h-[44px] hover:text-slate-500 [&.nav-active]:text-primary"
             [attr.aria-label]="'nav.' + item.key | translate">
            <div class="nav-icon w-9 h-7 flex items-center justify-center rounded-[10px] transition-colors [.nav-active_&]:bg-primary/10 relative">
              <tui-icon [icon]="navIcon(item.key)" class="w-5 h-5" />
              @if (item.key === 'notifications' && notifStore.unreadCount() > 0) {
                <span class="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center leading-none">
                  {{ notifStore.unreadCount() > 9 ? '9+' : notifStore.unreadCount() }}
                </span>
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

  protected navIcon(key: string): string {
    const map: Record<string, string> = {
      home:          '@tui.home',
      escrow:        '@tui.arrow-up-down',
      disputes:      '@tui.triangle-alert',
      payouts:       '@tui.circle-arrow-up',
      profile:       '@tui.user',
      adminHome:     '@tui.layout-grid',
      adminDisputes: '@tui.triangle-alert',
      adminUsers:    '@tui.users',
      notifications: '@tui.bell',
    };
    return map[key] ?? '@tui.circle';
  }
}
