import { HttpInterceptorFn } from '@angular/common/http';
import { throwError } from 'rxjs';

export const offlineInterceptor: HttpInterceptorFn = (req, next) => {
  if (!navigator.onLine) {
    return throwError(() => ({
      status: 0,
      error: { code: 'OFFLINE', message: 'Vérifiez votre connexion internet.' },
    }));
  }
  return next(req);
};
