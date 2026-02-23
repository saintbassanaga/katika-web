import { HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

// null  = refresh in progress
// true  = refresh succeeded
// false = refresh failed
let isRefreshing = false;
const refreshDone$ = new BehaviorSubject<boolean | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (req.url.includes('/bff/auth/')) return next(req);

  return next(req).pipe(
    catchError(err => {
      if (err.status !== HttpStatusCode.Unauthorized) return throwError(() => err);

      if (!isRefreshing) {
        isRefreshing = true;
        refreshDone$.next(null); // signal: refresh in progress

        return auth.refreshToken().pipe(
          switchMap(() => {
            isRefreshing = false;
            refreshDone$.next(true); // signal: refresh succeeded
            return next(req.clone({ withCredentials: true }));
          }),
          catchError(refreshErr => {
            isRefreshing = false;
            refreshDone$.next(false); // signal: refresh failed
            router.navigate(['/auth/login'], {
              queryParams: { returnUrl: router.url },
            });
            return throwError(() => refreshErr);
          }),
        );
      }

      // Another refresh is already in flight — wait for its result
      return refreshDone$.pipe(
        filter(done => done !== null), // null = still in progress, skip
        take(1),
        switchMap(succeeded => {
          if (succeeded) return next(req.clone({ withCredentials: true }));
          return throwError(() => err); // refresh failed, propagate original 401
        }),
      );
    }),
  );
};
