import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';

interface SidebarItem { key: string; label: string; route: string; roles?: string[]; }

const SIDEBAR_ITEMS: SidebarItem[] = [
  { key: 'home',    label: 'Tableau de bord', route: '/dashboard' },
  { key: 'escrow',  label: 'Transactions',    route: '/escrow'    },
  { key: 'disputes',label: 'Litiges',         route: '/disputes'  },
  { key: 'wallet',  label: 'Portefeuille',    route: '/wallet'    },
  { key: 'payouts', label: 'Retraits',        route: '/payouts'   },
  { key: 'admin',   label: 'Administration',  route: '/admin', roles: ['ADMIN', 'SUPERVISOR'] },
  { key: 'profile', label: 'Profil',          route: '/profile'   },
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  styles: [`
    aside {
      position: fixed; left: 0; top: 0; bottom: 0; width: 256px;
      background: #0F2240; z-index: 40;
      display: flex; flex-direction: column;
    }
    .logo-area {
      padding: 1.5rem 1.25rem 1.25rem;
      border-bottom: 1px solid rgba(255,255,255,.07);
      display: flex; align-items: center; gap: .75rem;
    }
    .k-mark {
      width: 40px; height: 40px; flex-shrink: 0;
      background: linear-gradient(135deg, #1B4F8A, #0D3D6E);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
    }
    .logo-text { color: #fff; font-size: 1.25rem; font-weight: 800; letter-spacing: -.02em; }
    .logo-sub  { color: rgba(148,163,184,.5); font-size: .6875rem; font-weight: 400; }

    .user-area {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid rgba(255,255,255,.07);
      display: flex; align-items: center; gap: .75rem;
    }
    .user-avatar {
      width: 40px; height: 40px; flex-shrink: 0;
      background: linear-gradient(135deg, #1B4F8A, #0D3D6E);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: .8125rem; font-weight: 700;
    }
    .user-name  { color: #EDF1F7; font-size: .875rem; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .user-role  { color: rgba(148,163,184,.6); font-size: .6875rem; text-transform: uppercase; letter-spacing: .06em; }

    nav { flex: 1; overflow-y: auto; padding: .75rem; }
    .nav-item {
      display: flex; align-items: center; gap: .75rem;
      padding: .6875rem .875rem;
      border-radius: 12px;
      color: rgba(148,163,184,.8);
      text-decoration: none;
      font-size: .875rem; font-weight: 500;
      transition: background .18s, color .18s;
      min-height: 44px;
      margin-bottom: 2px;
    }
    .nav-item:hover { background: rgba(255,255,255,.05); color: #E2E8F0; }
    .nav-item.active {
      background: rgba(27,79,138,.18);
      color: #74B3F0;
      font-weight: 600;
    }
    .nav-icon { width: 20px; height: 20px; flex-shrink: 0; }

    .logout-area { padding: .75rem; border-top: 1px solid rgba(255,255,255,.07); }
    .logout-btn {
      display: flex; align-items: center; gap: .75rem;
      width: 100%; padding: .6875rem .875rem;
      border-radius: 12px;
      background: none; border: none; cursor: pointer;
      color: rgba(248,113,113,.75); font-size: .875rem; font-weight: 500;
      transition: background .18s, color .18s;
      min-height: 44px; font-family: inherit;
    }
    .logout-btn:hover { background: rgba(220,38,38,.1); color: #F87171; }
  `],
  template: `
    <aside>
      <!-- Logo -->
      <div class="logo-area">
        <div class="k-mark">
          <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
            <path d="M7 5v18M7 14l10-9M7 14l10 9" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div>
          <div class="logo-text">Katika</div>
          <div class="logo-sub">Paiements sécurisés</div>
        </div>
      </div>


      <!-- Nav -->
      <nav aria-label="Navigation principale">
        @for (item of visibleItems(); track item.route) {
          <a [routerLink]="item.route" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">
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
                @case ('admin') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M20 12h2M2 12h2M17.66 17.66l-1.41-1.41M6.34 17.66l1.41-1.41"/>
                  </svg>
                }
                @case ('profile') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                }
              }
            </span>
            {{ item.label }}
          </a>
        }
      </nav>

      <!-- User info -->
      <div class="user-area">
        <div class="user-avatar">{{ auth.initials() }}</div>
        <div style="overflow:hidden">
          <div class="user-name">{{ auth.fullName() }}</div>
          <div class="user-role">{{ auth.role() }}</div>
        </div>
      </div>

      <!-- Logout -->
      <div class="logout-area">
        <button (click)="auth.logout()" class="logout-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Déconnexion
        </button>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  protected readonly auth = inject(AuthStore);
  protected visibleItems() {
    const role = this.auth.role();
    return SIDEBAR_ITEMS.filter(i => !i.roles || (role && i.roles.includes(role)));
  }
}
