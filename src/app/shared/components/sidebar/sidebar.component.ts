import { Component, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthStore } from '@core/auth/auth.store';
import { SidebarItem } from '@shared/models/model';

const USER_ITEMS: SidebarItem[] = [
  { key: 'home',     route: '/dashboard' },
  { key: 'escrow',   route: '/escrow'    },
  { key: 'disputes', route: '/disputes'  },
  { key: 'wallet',   route: '/wallet'    },
  { key: 'payouts',  route: '/payouts'   },
  { key: 'profile',  route: '/profile'   },
];

const ADMIN_ITEMS: SidebarItem[] = [
  { key: 'adminHome',         route: '/admin/dashboard'                                    },
  { key: 'adminDisputes',     route: '/admin/disputes'                                     },
  { key: 'adminUsers',        route: '/admin/users',        roles: ['ADMIN', 'SUPERVISOR'] },
  { key: 'adminTransactions', route: '/admin/transactions', roles: ['ADMIN', 'SUPERVISOR'] },
  { key: 'profile',           route: '/profile'                                            },
];

const STAFF_ROLES = new Set(['ADMIN', 'SUPERVISOR', 'SUPPORT']);

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  template: `
    <aside class="fixed left-0 top-0 bottom-0 w-64 bg-dark z-40 flex flex-col">

      <!-- Logo -->
      <div class="px-5 pt-6 pb-5 border-b border-white/[.07] flex items-center gap-3">
        <img src="/icons/icon-512-transparent.png" alt="Katika" class="w-10 h-10 object-contain shrink-0" />
        <div>
          <div class="text-white text-xl font-extrabold tracking-[-0.02em]">Katika</div>
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
            <span class="w-5 h-5 shrink-0">
              @switch (item.key) {
                @case ('home') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                }
                @case ('escrow') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4"/>
                  </svg>
                }
                @case ('disputes') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                }
                @case ('wallet') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                }
                @case ('payouts') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M16 12l-4-4-4 4M12 16V8"/>
                  </svg>
                }
                @case ('profile') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                }
                @case ('adminHome') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                  </svg>
                }
                @case ('adminDisputes') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                }
                @case ('adminUsers') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                  </svg>
                }
                @case ('adminTransactions') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                  </svg>
                }
              }
            </span>
            {{ 'nav.' + item.key | translate }}
          </a>
        }
      </nav>

      <!-- Logout -->
      <div class="p-3 border-t border-white/[.07]">
        <button (click)="auth.logout()"
                class="flex items-center gap-3 w-full px-3.5 py-[.6875rem] rounded-xl bg-none border-none cursor-pointer text-red-400/75 text-sm font-medium transition-all min-h-[44px] font-[inherit] hover:bg-red-600/10 hover:text-red-400">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {{ 'nav.logout' | translate }}
        </button>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  protected readonly auth = inject(AuthStore);

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
