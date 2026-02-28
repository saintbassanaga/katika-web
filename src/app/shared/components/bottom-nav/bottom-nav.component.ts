import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

interface NavItem { key: string; route: string; }

const NAV_ITEMS: NavItem[] = [
  { key: 'home',     route: '/dashboard' },
  { key: 'escrow',   route: '/escrow'    },
  { key: 'disputes', route: '/disputes'  },
  { key: 'payouts',  route: '/payouts'   },
  { key: 'profile',  route: '/profile'   },
];

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  styles: [':host { display: block; }'],
  template: `
    <nav class="fixed bottom-0 left-0 right-0 z-50 bg-white/[.88] backdrop-blur-[16px] backdrop-saturate-[180%] border-t border-slate-200/80 safe-area-bottom" aria-label="Navigation principale">
      <div class="flex items-stretch h-[60px]">
        @for (item of navItems; track item.route) {
          <a [routerLink]="item.route"
             routerLinkActive="nav-active"
             class="flex-1 flex flex-col items-center justify-center gap-[3px] text-slate-400 no-underline transition-colors relative min-h-[44px] hover:text-slate-500 [&.nav-active]:text-primary"
             [attr.aria-label]="'nav.' + item.key | translate">
            <div class="w-9 h-7 flex items-center justify-center rounded-[10px] transition-colors [.nav-active_&]:bg-primary/10">
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
              }
            </div>
            <span class="text-[.625rem] font-semibold tracking-[.02em]">{{ 'nav.' + item.key | translate }}</span>
          </a>
        }
      </div>
    </nav>
  `,
})
export class BottomNavComponent {
  protected readonly navItems = NAV_ITEMS;
}
