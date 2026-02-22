import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from './auth.store';

export const roleGuard = (...roles: string[]): CanActivateFn => () => {
  const store = inject(AuthStore);
  const router = inject(Router);

  if (roles.includes(store.role()!)) return true;

  return router.createUrlTree(['/403']);
};
