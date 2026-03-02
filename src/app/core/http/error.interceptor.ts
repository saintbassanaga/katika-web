import { HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { ToastService } from '../notification/toast.service';

const ERROR_CODE_KEYS: Record<string, string> = {
  RATE_LIMIT_EXCEEDED:    'errors.codes.RATE_LIMIT_EXCEEDED',
  INSUFFICIENT_BALANCE:   'errors.codes.INSUFFICIENT_BALANCE',
  TRANSACTION_NOT_FOUND:  'errors.codes.TRANSACTION_NOT_FOUND',
  INVALID_MFA_CODE:       'errors.codes.INVALID_MFA_CODE',
  INVALID_OTP:            'errors.codes.INVALID_OTP',
  DISPUTE_ALREADY_EXISTS: 'errors.codes.DISPUTE_ALREADY_EXISTS',
  OFFLINE:                'errors.codes.OFFLINE',
};

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast     = inject(ToastService);
  const translate = inject(TranslateService);

  return next(req).pipe(
    catchError(err => {
      const code   = err?.error?.error?.code as string | undefined;
      const apiMsg = err?.error?.error?.message ?? err?.error?.message;

      const message = code && ERROR_CODE_KEYS[code]
        ? translate.instant(ERROR_CODE_KEYS[code])
        : (apiMsg ?? translate.instant('errors.codes.default'));

      if (err.status !== HttpStatusCode.Unauthorized) {
        toast.error(message);
      }

      return throwError(() => err);
    }),
  );
};
