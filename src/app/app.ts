import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { AuthStore } from './core/auth/auth.store';
import { ToastContainerComponent } from './shared/components/toast/toast-container.component';
import { BottomNavComponent } from './shared/components/bottom-nav/bottom-nav.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { FabComponent } from './shared/components/fab/fab.component';
import { OnboardingComponent } from './shared/components/onboarding/onboarding.component';

/** Routes where the global nav (sidebar / bottom-nav) is visible. */
const NAV_ROUTES = ['/dashboard', '/escrow', '/disputes', '/payouts', '/wallet', '/admin', '/profile', '/notifications'];

/** Full-screen routes that suppress the nav (e.g. dispute chat room). */
const FULL_SCREEN_PATTERNS = [
  /^\/disputes\/(?!new(?:\/|$))[^/]+/, // /disputes/:id but not /disputes/new
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent, BottomNavComponent, SidebarComponent, FabComponent, OnboardingComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly auth   = inject(AuthStore);
  private  readonly router  = inject(Router);
  private  readonly bp      = inject(BreakpointObserver);

  private readonly _onboardingDismissed = signal(!!localStorage.getItem('katika_onboarded'));

  protected readonly showOnboardingOverlay = computed(() =>
    this.auth.isAuthenticated() && !this._onboardingDismissed(),
  );

  protected onOnboardingDone() {
    localStorage.setItem('katika_onboarded', '1');
    this._onboardingDismissed.set(true);
  }

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

  /** True for authenticated full-screen routes (e.g. dispute chat). */
  protected readonly isFullScreen = computed(() => {
    if (!this.auth.isAuthenticated()) return false;
    const url = this.currentUrl() ?? '';
    return FULL_SCREEN_PATTERNS.some(p => p.test(url));
  });

  protected readonly shellClass = computed(() => {
    if (this.showNav())      return 'h-screen flex overflow-hidden';
    if (this.isFullScreen()) return 'h-screen flex flex-col overflow-hidden';
    return 'min-h-screen flex flex-col';
  });

  protected readonly contentClass = computed(() => {
    if (this.isFullScreen()) return 'w-full flex-1 min-h-0 overflow-y-auto';
    if (!this.showNav())     return 'w-full flex-1';
    return this.isMobile() ? 'w-full pb-16 flex-1 min-h-0 overflow-y-auto' : 'ml-64 flex-1 min-h-0 overflow-y-auto';
  });
}
