import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { AuthStore } from './core/auth/auth.store';
import { ToastContainerComponent } from './shared/components/toast/toast-container.component';
import { BottomNavComponent } from './shared/components/bottom-nav/bottom-nav.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent, BottomNavComponent, SidebarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly auth = inject(AuthStore);

  private readonly bp = inject(BreakpointObserver);

  protected readonly isMobile = toSignal(
    this.bp.observe([Breakpoints.XSmall, Breakpoints.Small]).pipe(
      map(r => r.matches),
    ),
    { initialValue: true },
  );

  protected readonly contentClass = computed(() => {
    if (!this.auth.isAuthenticated()) return 'w-full';
    return this.isMobile() ? 'w-full pb-16' : 'ml-64';
  });
}
