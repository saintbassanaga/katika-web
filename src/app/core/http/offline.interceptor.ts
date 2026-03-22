import { HttpInterceptorFn } from '@angular/common/http';
import { throwError } from 'rxjs';

export const offlineInterceptor: HttpInterceptorFn = (req, next) => {
  // navigator.onLine n'existe pas en SSR (Node.js) — on vérifie explicitement false
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return throwError(() => ({
      status: 0,
      error: { code: 'OFFLINE', message: 'Vérifiez votre connexion internet.' },
    }));
  }
  return next(req);
};
