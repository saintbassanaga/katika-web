import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/http/api.service';

export interface PayoutRequest {
  amount: number;
  provider: 'CAMPAY' | 'MONETBIL';
  phone: string;
}

@Injectable({ providedIn: 'root' })
export class PayoutService extends ApiService {
  create(req: PayoutRequest): Observable<{ payoutId: string }> {
    return this.http.post<{ payoutId: string }>(this.url('/api/payouts'), req, this.defaultOptions);
  }

  requestOtp(payoutId: string): Observable<{ expiresAt: string }> {
    return this.http.post<{ expiresAt: string }>(this.url(`/api/payouts/${payoutId}/otp`), {}, this.defaultOptions);
  }

  submit(payoutId: string, otp: string): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(this.url(`/api/payouts/${payoutId}/submit`), { otp }, this.defaultOptions);
  }

  getBalance(): Observable<{ balance: number; frozenAmount: number }> {
    return this.http.get<{ balance: number; frozenAmount: number }>(this.url('/api/wallet'), this.defaultOptions);
  }
}
