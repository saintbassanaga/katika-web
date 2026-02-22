import { HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

const refreshing$ = new BehaviorSubject<boolean>(false);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (req.url.includes('/bff/auth/')) return next(req);

  return next(req).pipe(
    catchError(err => {
      if (err.status !== HttpStatusCode.Unauthorized) return throwError(() => err);

      if (!refreshing$.getValue()) {
        refreshing$.next(true);
        return auth.refreshToken().pipe(
          switchMap(() => {
            refreshing$.next(false);
            return next(req.clone({ withCredentials: true }));
          }),
          catchError(refreshErr => {
            refreshing$.next(false);
            router.navigate(['/auth/login'], {
              queryParams: { returnUrl: router.url },
            });
            return throwError(() => refreshErr);
          }),
        );
      }

      return refreshing$.pipe(
        filter(isRefreshing => !isRefreshing),
        take(1),
        switchMap(() => next(req.clone({ withCredentials: true }))),
      );
    }),
  );
};
