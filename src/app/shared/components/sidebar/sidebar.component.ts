import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { TuiIcon } from '@taiga-ui/core';
import { AuthStore } from '@core/auth/auth.store';
import { NotificationStore } from '@features/notifications/notification.store';
import { SidebarItem } from '@shared/models/model';

const ICON_MAP: Record<string, string> = {
  home:              '@tui.home',
  escrow:            '@tui.arrow-left-right',
  disputes:          '@tui.alert-triangle',
  wallet:            '@tui.wallet',
  payouts:           '@tui.arrow-up-right',
  notifications:     '@tui.bell',
  profile:           '@tui.user',
  adminHome:         '@tui.grid',
  adminDisputes:     '@tui.alert-triangle',
  adminUsers:        '@tui.users',
  adminTransactions: '@tui.receipt',
};

const USER_ITEMS: SidebarItem[] = [
  { key: 'home',          route: '/dashboard'     },
  { key: 'escrow',        route: '/escrow'        },
  { key: 'disputes',      route: '/disputes'      },
  { key: 'wallet',        route: '/wallet'        },
  { key: 'payouts',       route: '/payouts'       },
  { key: 'notifications', route: '/notifications' },
  { key: 'profile',       route: '/profile'       },
];

const ADMIN_ITEMS: SidebarItem[] = [
  { key: 'adminHome',         route: '/admin/dashboard'                                    },
  { key: 'adminDisputes',     route: '/admin/disputes'                                     },
  { key: 'adminUsers',        route: '/admin/users',        roles: ['ADMIN', 'SUPERVISOR'] },
  { key: 'adminTransactions', route: '/admin/transactions', roles: ['ADMIN', 'SUPERVISOR'] },
  { key: 'notifications',     route: '/notifications'                                      },
  { key: 'profile',           route: '/profile'                                            },
];

const STAFF_ROLES = new Set(['ADMIN', 'SUPERVISOR', 'SUPPORT']);

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslatePipe, TuiIcon],
  template: `
    <aside class="fixed left-0 top-0 bottom-0 w-64 bg-dark z-40 flex flex-col">

      <!-- Logo -->
      <div class="px-5 pt-6 pb-5 border-b border-white/[.07] flex items-center gap-3">
        <img src="/icons/icon-512-transparent.png" alt="Katica" class="w-10 h-10 object-contain shrink-0" />
        <div>
          <div class="text-white text-xl font-extrabold tracking-[-0.02em]">Katica</div>
          <div class="text-slate-400/50 text-[.6875rem]">{{ isStaff() ? ('nav.adminSubtitle' | translate) : ('nav.subtitle' | translate) }}</div>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 overflow-y-auto p-3" [attr.aria-label]="'nav.dashboard' | translate">
        @for (item of visibleItems(); track item.route) {
          <a [routerLink]="item.route"
             routerLinkActive="nav-active"
             class="flex items-center gap-3 px-3.5 py-[.6875rem] rounded-xl text-slate-400/80 no-underline text-sm font-medium transition-all min-h-[44px] mb-0.5
                    hover:bg-white/5 hover:text-slate-200
                    [&.nav-active]:bg-primary/[.18] [&.nav-active]:text-[#74B3F0] [&.nav-active]:font-semibold">
            <tui-icon [icon]="iconMap[item.key]" class="w-5 h-5 shrink-0" />
            <span class="flex-1">{{ 'nav.' + item.key | translate }}</span>
            @if (item.key === 'notifications' && notifStore.unreadCount() > 0) {
              <span class="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center leading-none">
                {{ notifStore.unreadCount() > 99 ? '99+' : notifStore.unreadCount() }}
              </span>
            }
          </a>
        }
      </nav>

      <!-- Logout -->
      <div class="p-3 border-t border-white/[.07]">
        <button (click)="auth.logout()"
                class="flex items-center gap-3 w-full px-3.5 py-[.6875rem] rounded-xl bg-none border-none cursor-pointer text-red-400/75 text-sm font-medium transition-all min-h-[44px] font-[inherit] hover:bg-red-600/10 hover:text-red-400">
          <tui-icon icon="@tui.log-out" class="w-5 h-5" />
          {{ 'nav.logout' | translate }}
        </button>
      </div>
    </aside>
  `,
})
export class SidebarComponent implements OnInit {
  protected readonly auth       = inject(AuthStore);
  protected readonly notifStore = inject(NotificationStore);
  protected readonly iconMap    = ICON_MAP;

  ngOnInit(): void {
    this.notifStore.loadUnreadCount();
  }

  protected isStaff() {
    return STAFF_ROLES.has(this.auth.role() ?? '');
  }

  protected visibleItems() {
    const role = this.auth.role() ?? '';
    if (STAFF_ROLES.has(role)) {
      return ADMIN_ITEMS.filter(i => !i.roles || i.roles.includes(role));
    }
    return USER_ITEMS;
  }
}
