import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Plateformes détectées par le service.
 * - 'web'     → navigateur standard
 * - 'tauri'   → desktop Tauri 2.0 (Windows / macOS / Linux)
 * - 'android' → Android natif via Tauri Mobile
 * - 'ios'     → iOS natif via Tauri Mobile
 */
export type AppPlatform = 'web' | 'tauri' | 'android' | 'ios';

function resolvePlatform(): AppPlatform {
  if (typeof window === 'undefined') return 'web';

  // Tauri injecte window.__TAURI__ dans le WebView
  const tauri = (window as any).__TAURI__;
  if (!tauri) return 'web';

  // Sur mobile, Tauri expose __TAURI__.os.platform()
  // En pratique, le build mobile définit la variable d'env au compile time
  const os = tauri?.os?.platform?.() as string | undefined;
  if (os === 'android') return 'android';
  if (os === 'ios')     return 'ios';

  return 'tauri';
}

@Injectable({ providedIn: 'root' })
export class PlatformService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly platform = signal<AppPlatform>(
    isPlatformBrowser(this.platformId) ? resolvePlatform() : 'web',
  );

  // ── Computed helpers ───────────────────────────────────────────────────────

  readonly isAndroid     = computed(() => this.platform() === 'android');
  readonly isIos         = computed(() => this.platform() === 'ios');
  readonly isTauri       = computed(() => this.platform() === 'tauri');
  readonly isWeb         = computed(() => this.platform() === 'web');
  readonly isMobile      = computed(() => this.isAndroid() || this.isIos());
  readonly isDesktop     = computed(() => this.isTauri());
  readonly isDesktopLike = computed(() => this.isTauri() || this.isWeb());
  readonly isNative      = computed(() => this.isMobile() || this.isTauri());
  readonly useBottomNav  = computed(() => this.isMobile());

  readonly bodyClasses = computed(() => {
    const classes: string[] = [`platform-${this.platform()}`];
    if (this.isMobile())  classes.push('is-mobile');
    if (this.isTauri())   classes.push('is-tauri');
    if (this.isIos())     classes.push('safe-area-inset');
    return classes.join(' ');
  });

  // ── Utilitaires ────────────────────────────────────────────────────────────

  async openUrl(url: string): Promise<void> {
    if (this.isNative()) {
      const { TauriService } = await import('./tauri.service');
      // openExternalUrl est géré par TauriService
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async hapticLight(): Promise<void> {
    if (!this.isMobile()) return;
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('plugin:haptics|impact', { style: 'light' });
    } catch { /* non bloquant */ }
  }
}
