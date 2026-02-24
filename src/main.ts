// Polyfill `global` for browser/Tauri — required by sockjs-client & @stomp/stompjs
(window as any).global ??= window;

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

async function bootstrap() {
  // Only in production Tauri builds (tauri build):
  //   window.location.origin = tauri://localhost → rejected by CORS.
  //   Replace window.fetch with the Rust-based plugin fetch to bypass CORS.
  //   Also sync non-HttpOnly Set-Cookie headers back to document.cookie so
  //   csrfInterceptor can read XSRF-TOKEN and include X-XSRF-TOKEN on POSTs.
  //
  // In tauri dev:
  //   window.location.origin = http://localhost:4200 → CORS works normally.
  //   Keep native fetch so the browser cookie store and document.cookie stay
  //   in sync — required for CSRF double-submit and session management (MFA).
  if ((window as any).__TAURI__ && environment.production) {
    const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http');

    (window as any).fetch = async (
      input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> => {
      const response = await tauriFetch(input as string, init as any) as Response;
      syncCookiesToDocument(response.headers);
      return response;
    };
  }

  bootstrapApplication(App, appConfig).catch((err) => console.error(err));
}

/**
 * tauri-plugin-http overrides response.headers with `new Headers(rawRustHeaders)`
 * using "none" guard (not "response" guard), so set-cookie IS accessible here —
 * unlike with native browser fetch where the browser filters it.
 * We sync non-HttpOnly cookies to document.cookie so Angular's csrfInterceptor
 * can find XSRF-TOKEN and add the X-XSRF-TOKEN header on state-changing requests.
 */
function syncCookiesToDocument(headers: Headers): void {
  const raw = headers.get('set-cookie');
  if (!raw) return;

  // Rust may join multiple Set-Cookie values with '\n' when serialising to Record<string,string>
  const entries = raw.split('\n').map(s => s.trim()).filter(Boolean);

  for (const entry of entries) {
    const parts = entry.split(';').map(s => s.trim());
    const isHttpOnly = parts.some(p => p.toLowerCase() === 'httponly');
    if (!isHttpOnly) {
      document.cookie = entry;
    }
  }
}

bootstrap();
