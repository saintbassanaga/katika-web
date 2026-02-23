import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

async function bootstrap() {
  // In Tauri, replace window.fetch with the Rust-based plugin fetch.
  // This bypasses browser CORS restrictions (the webview origin tauri://localhost
  // is rejected by the API server's CORS policy). Reqwest manages the cookie jar.
  if ((window as any).__TAURI__) {
    const { fetch } = await import('@tauri-apps/plugin-http');
    (window as any).fetch = fetch;
  }

  bootstrapApplication(App, appConfig).catch((err) => console.error(err));
}

bootstrap();
