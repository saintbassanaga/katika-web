import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from './auth.store';

export const authGuard: CanActivateFn = (route) => {
  const store = inject(AuthStore);
  const router = inject(Router);

  if (store.isAuthenticated()) return true;

  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: route.url.map(s => s.path).join('/') },
  });
};
