import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface TauriPlatformInfo {
  os: 'linux' | 'windows' | 'macos' | 'android' | 'ios';
  arch: string;
  version: string;
  is_mobile: boolean;
  is_desktop: boolean;
}

/**
 * Service Tauri — wraps les appels invoke() Rust.
 * Tous les appels sont NO-OP silencieux si l'app tourne dans un navigateur.
 *
 * Utilisation :
 *   const tauri = inject(TauriService);
 *   if (tauri.isTauri()) {
 *     const info = await tauri.getPlatformInfo();
 *   }
 */
@Injectable({ providedIn: 'root' })
export class TauriService {
  private readonly platformId = inject(PLATFORM_ID);

  /** Vrai si l'app tourne dans une fenêtre Tauri (window.__TAURI__ injecté) */
  readonly isTauri = signal<boolean>(
    isPlatformBrowser(this.platformId) && !!(window as any).__TAURI__,
  );

  // ── Commandes Rust ─────────────────────────────────────────────────────────

  /**
   * Récupère les informations de la plateforme via Rust.
   * Retourne null si hors Tauri.
   */
  async getPlatformInfo(): Promise<TauriPlatformInfo | null> {
    if (!this.isTauri()) return null;
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<TauriPlatformInfo>('get_platform_info');
  }

  /**
   * Ouvre une URL dans le navigateur système via le backend Rust.
   * Remplace window.open() pour une expérience desktop native.
   */
  async openExternalUrl(url: string): Promise<void> {
    if (!this.isTauri()) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('open_external_url', { url });
  }

  /**
   * Vérifie la connectivité API via Rust (pas de CORS, exécuté côté natif).
   */
  async checkApiConnectivity(): Promise<boolean> {
    if (!this.isTauri()) return navigator.onLine;
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<boolean>('check_api_connectivity');
  }

  /**
   * Écoute un événement émis depuis Rust vers le frontend.
   * Retourne une fonction de cleanup (unlisten).
   *
   * Exemple Rust :
   *   app_handle.emit("payment-status", payload)?;
   *
   * Exemple Angular :
   *   const stop = await tauri.on('payment-status', (e) => console.log(e.payload));
   *   // Plus tard : stop();
   */
  async on<T>(event: string, handler: (payload: T) => void): Promise<() => void> {
    if (!this.isTauri()) return () => {};
    const { listen } = await import('@tauri-apps/api/event');
    return listen<T>(event, (e) => handler(e.payload));
  }

  /**
   * Émet un événement depuis Angular vers Rust (ou d'autres fenêtres).
   *
   * Exemple Rust :
   *   app.listen("scan-result", |event| { ... });
   */
  async emit(event: string, payload?: unknown): Promise<void> {
    if (!this.isTauri()) return;
    const { emit } = await import('@tauri-apps/api/event');
    await emit(event, payload);
  }
}
