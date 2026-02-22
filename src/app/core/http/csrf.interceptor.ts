import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE']);
// Auth endpoints don't need CSRF — user isn't authenticated yet
const CSRF_SKIP_PATHS = ['/bff/auth/login', '/bff/auth/refresh', '/auth/register'];

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  if (SAFE_METHODS.has(req.method)) return next(req);
  if (CSRF_SKIP_PATHS.some(p => req.url.includes(p))) return next(req);

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
