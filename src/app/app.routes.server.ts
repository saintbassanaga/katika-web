import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // ── Pages publiques — HTML statique généré au build ────────────────────────
  { path: 'auth/login',           renderMode: RenderMode.Prerender },
  { path: 'auth/register',        renderMode: RenderMode.Prerender },
  { path: 'auth/forgot-password', renderMode: RenderMode.Prerender },
  { path: 'reset-password',       renderMode: RenderMode.Prerender },
  { path: '403',                  renderMode: RenderMode.Prerender },

  // ── Pages authentifiées — CSR (nécessitent un token) ──────────────────────
  { path: '**',                   renderMode: RenderMode.Client },
];
