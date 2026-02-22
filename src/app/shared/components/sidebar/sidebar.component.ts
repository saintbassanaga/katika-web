import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';

interface SidebarItem {
  icon: string;
  label: string;
  route: string;
  roles?: string[];
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { icon: '⌂', label: 'Tableau de bord', route: '/dashboard' },
  { icon: '⇄', label: 'Transactions',    route: '/escrow'    },
  { icon: '!', label: 'Litiges',         route: '/disputes'  },
  { icon: '◎', label: 'Portefeuille',    route: '/wallet'    },
  { icon: '↑', label: 'Retraits',        route: '/payouts'   },
  { icon: '✦', label: 'Administration',  route: '/admin', roles: ['ADMIN', 'SUPERVISOR'] },
  { icon: '⚙', label: 'Profil',          route: '/profile'   },
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 z-40 flex flex-col">
      <!-- Logo -->
      <div class="p-6 border-b border-gray-100">
        <h1 class="text-2xl font-bold" style="color:#1A56DB">Katika</h1>
        <p class="text-xs text-gray-500 mt-1">Paiements sécurisés</p>
      </div>

      <!-- User info -->
      <div class="p-4 border-b border-gray-100">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
               style="background:#1A56DB">
            {{ auth.initials() }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-gray-900 truncate">{{ auth.fullName() }}</p>
            <p class="text-xs text-gray-500">{{ auth.role() }}</p>
          </div>
        </div>
      </div>

      <!-- Nav items -->
      <nav class="flex-1 overflow-y-auto p-3" aria-label="Navigation principale">
        @for (item of visibleItems(); track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="active-nav"
            class="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600
                   hover:bg-gray-50 hover:text-gray-900 transition-colors mb-1 min-h-[44px]"
          >
            <span class="text-xl w-6 text-center leading-none">{{ item.icon }}</span>
            <span class="text-sm font-medium">{{ item.label }}</span>
          </a>
        }
      </nav>

      <!-- Logout -->
      <div class="p-3 border-t border-gray-100">
        <button
          (click)="auth.logout()"
          class="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-red-600
                 hover:bg-red-50 transition-colors min-h-[44px]"
        >
          <span class="text-xl w-6 text-center">⏻</span>
          <span class="text-sm font-medium">Déconnexion</span>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .active-nav {
      background-color: #EBF5FF;
      color: #1A56DB;
      font-weight: 600;
    }
  `],
})
export class SidebarComponent {
  protected readonly auth = inject(AuthStore);

  protected visibleItems() {
    const role = this.auth.role();
    return SIDEBAR_ITEMS.filter(item =>
      !item.roles || (role && item.roles.includes(role))
    );
  }
}
