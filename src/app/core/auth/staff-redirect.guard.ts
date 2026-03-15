import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from './auth.store';

const STAFF_ROLES = new Set(['ADMIN', 'SUPERVISOR', 'SUPPORT']);

/** Redirects staff users away from user-only pages to the admin panel. */
export const staffRedirectGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  const router = inject(Router);

  if (STAFF_ROLES.has(store.role() ?? '')) {
    return router.createUrlTree(['/admin']);
  }
  return true;
};
