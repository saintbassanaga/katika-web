import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TUI_IS_MOBILE } from '@taiga-ui/cdk';

export const desktopGuard: CanActivateFn = () => {
  const isMobile = inject(TUI_IS_MOBILE);
  const router = inject(Router);

  if (!isMobile) return true;

  return router.createUrlTree(['/admin-desktop-only']);
};
