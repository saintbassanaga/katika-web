import { HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../notification/toast.service';

const ERROR_MESSAGES: Record<string, string> = {
  RATE_LIMIT_EXCEEDED:    'Trop de tentatives. Réessayez dans quelques minutes.',
  INSUFFICIENT_BALANCE:   'Solde insuffisant pour cette opération.',
  TRANSACTION_NOT_FOUND:  'Transaction introuvable.',
  INVALID_MFA_CODE:       'Code de vérification invalide.',
  INVALID_OTP:            'Code OTP invalide ou expiré.',
  DISPUTE_ALREADY_EXISTS: 'Un litige est déjà en cours pour cette transaction.',
  OFFLINE:                'Vérifiez votre connexion internet.',
};

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError(err => {
      const code = err?.error?.error?.code as string;
      const message = ERROR_MESSAGES[code]
        ?? err?.error?.error?.message
        ?? err?.error?.message
        ?? 'Une erreur est survenue. Réessayez.';

      if (err.status !== HttpStatusCode.Unauthorized) {
        toast.error(message);
      }

      return throwError(() => err);
    }),
  );
};
