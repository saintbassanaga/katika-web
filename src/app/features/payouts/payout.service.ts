import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/http/api.service';
import { PayoutRequest, PayoutRequestResponse } from '@shared/models/model';

export type { PayoutRequest, PayoutRequestResponse };

@Injectable({ providedIn: 'root' })
export class PayoutService extends ApiService {
  create(req: PayoutRequest): Observable<PayoutRequestResponse> {
    return this.http.post<PayoutRequestResponse>(this.url('/api/payouts'), req, this.defaultOptions);
  }

  validateOtp(payoutId: string, code: string): Observable<PayoutRequestResponse> {
    return this.http.post<PayoutRequestResponse>(this.url(`/api/payouts/${payoutId}/otp`), { code }, this.defaultOptions);
  }

  submit(payoutId: string): Observable<PayoutRequestResponse> {
    return this.http.post<PayoutRequestResponse>(this.url(`/api/payouts/${payoutId}/submit`), {}, this.defaultOptions);
  }

  getBalance(): Observable<{ balance: number; frozenAmount: number }> {
    return this.http.get<{ balance: number; frozenAmount: number }>(this.url('/api/wallet'), this.defaultOptions);
  }
}
