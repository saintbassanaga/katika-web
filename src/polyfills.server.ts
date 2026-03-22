/**
 * Polyfills pour le SSR (Node.js).
 * Ce fichier doit être le PREMIER import de main.server.ts pour s'exécuter
 * avant que @ng-web-apis/common capture les références aux APIs browser.
 */

if (typeof requestAnimationFrame === 'undefined') {
  (globalThis as any).requestAnimationFrame = (cb: FrameRequestCallback) =>
    setTimeout(cb, 16) as unknown as number;
  (globalThis as any).cancelAnimationFrame = (id: number) => clearTimeout(id);
}
