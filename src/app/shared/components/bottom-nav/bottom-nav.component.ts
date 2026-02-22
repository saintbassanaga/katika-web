import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthStore } from '../../../core/auth/auth.store';

interface NavItem { key: string; label: string; route: string; }

const NAV_ITEMS: NavItem[] = [
  { key: 'home',    label: 'Accueil',      route: '/dashboard' },
  { key: 'escrow',  label: 'Transactions', route: '/escrow'    },
  { key: 'disputes',label: 'Litiges',      route: '/disputes'  },
  { key: 'payouts', label: 'Retrait',      route: '/payouts'   },
  { key: 'profile', label: 'Profil',       route: '/profile'   },
];

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  styles: [`
    nav {
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
      background: rgba(255,255,255,.88);
      backdrop-filter: blur(16px) saturate(180%);
      -webkit-backdrop-filter: blur(16px) saturate(180%);
      border-top: 1px solid rgba(226,232,240,.8);
      padding-bottom: env(safe-area-inset-bottom);
    }
    .nav-inner { display: flex; align-items: stretch; height: 60px; }
    .nav-item {
      flex: 1;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 3px;
      color: #94A3B8;
      text-decoration: none;
      transition: color .2s;
      position: relative;
      min-height: 44px;
    }
    .nav-item:hover { color: #64748B; }
    .nav-item.active { color: #1B4F8A; }
    .nav-icon-wrap {
      width: 36px; height: 28px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 10px;
      transition: background .2s;
    }
    .nav-item.active .nav-icon-wrap { background: rgba(27,79,138,.1); }
    .nav-label { font-size: .625rem; font-weight: 600; letter-spacing: .02em; }
  `],
  template: `
    <nav aria-label="Navigation principale">
      <div class="nav-inner">
        @for (item of navItems; track item.route) {
          <a [routerLink]="item.route"
             routerLinkActive="active"
             class="nav-item"
             [attr.aria-label]="item.label">
            <div class="nav-icon-wrap">
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
            <span class="nav-label">{{ 'nav.' + item.key | translate }}</span>
          </a>
        }
      </div>
    </nav>
  `,
})
export class BottomNavComponent {
  protected readonly auth = inject(AuthStore);
  protected readonly navItems = NAV_ITEMS;
}
