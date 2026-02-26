import { Component, computed, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { AuthStore } from './core/auth/auth.store';
import { ToastContainerComponent } from './shared/components/toast/toast-container.component';
import { BottomNavComponent } from './shared/components/bottom-nav/bottom-nav.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { FabComponent } from './shared/components/fab/fab.component';

/** Routes where the global nav (sidebar / bottom-nav) is visible. */
const NAV_ROUTES = ['/dashboard', '/escrow', '/disputes', '/payouts', '/wallet', '/admin'];

/** Full-screen routes that suppress the nav (e.g. dispute chat room). */
const FULL_SCREEN_PATTERNS = [
  /^\/disputes\/(?!new(?:\/|$))[^/]+/, // /disputes/:id but not /disputes/new
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent, BottomNavComponent, SidebarComponent, FabComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly auth   = inject(AuthStore);
  private  readonly router  = inject(Router);
  private  readonly bp      = inject(BreakpointObserver);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map((e: NavigationEnd) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
  );

  protected readonly isMobile = toSignal(
    this.bp.observe([Breakpoints.XSmall, Breakpoints.Small]).pipe(map(r => r.matches)),
    { initialValue: true },
  );

  /** True only on main app pages that have the persistent nav. */
  protected readonly showNav = computed(() => {
    if (!this.auth.isAuthenticated()) return false;
    const url = this.currentUrl() ?? '';
    if (FULL_SCREEN_PATTERNS.some(p => p.test(url))) return false;
    return NAV_ROUTES.some(r => url.startsWith(r));
  });

  protected readonly contentClass = computed(() => {
    if (!this.showNav()) return 'w-full';
    return this.isMobile() ? 'w-full pb-16' : 'ml-64';
  });
}
