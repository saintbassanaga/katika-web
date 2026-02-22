import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';

interface NavItem {
  icon: string;
  label: string;
  route: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: '⌂', label: 'Accueil',      route: '/dashboard' },
  { icon: '⇄', label: 'Transactions', route: '/escrow'    },
  { icon: '!', label: 'Litiges',      route: '/disputes'  },
  { icon: '↑', label: 'Retrait',      route: '/payouts'   },
  { icon: '◎', label: 'Profil',       route: '/profile'   },
];

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav
      class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-bottom"
      aria-label="Navigation principale"
    >
      <div class="flex items-stretch h-16">
        @for (item of navItems; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="text-primary border-t-2 border-primary"
            class="flex-1 flex flex-col items-center justify-center gap-1 text-gray-500
                   transition-colors min-h-[44px] hover:text-primary"
            [attr.aria-label]="item.label"
          >
            <span class="text-xl leading-none">{{ item.icon }}</span>
            <span class="text-xs font-medium">{{ item.label }}</span>
          </a>
        }
      </div>
    </nav>
  `,
  styles: [`
    .text-primary { color: #1A56DB; }
    .border-primary { border-color: #1A56DB; }
    .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }
  `],
})
export class BottomNavComponent {
  protected readonly auth = inject(AuthStore);
  protected readonly navItems = NAV_ITEMS;
}
