import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE']);

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  if (SAFE_METHODS.has(req.method)) return next(req);

  const cookie = inject(DOCUMENT).cookie
    .split('; ')
    .find(c => c.startsWith('XSRF-TOKEN='))
    ?.split('=')[1];

  if (!cookie) return next(req);

  return next(req.clone({
    setHeaders: { 'X-XSRF-TOKEN': decodeURIComponent(cookie) },
    withCredentials: true,
  }));
};
