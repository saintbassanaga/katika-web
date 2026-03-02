import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/http/api.service';
import {
  Page,
  EscrowCreateRequest,
  TransactionSummary,
  TransactionDetail,
  ScanResponse,
} from '@app/models';

@Injectable({ providedIn: 'root' })
export class EscrowService extends ApiService {
  createTransaction(req: EscrowCreateRequest): Observable<TransactionSummary> {
    return this.http.post<TransactionSummary>(
      this.url('/api/escrow'),
      req,
      this.defaultOptions,
    );
  }

  getTransactions(params: { status?: string; page?: number; size?: number }): Observable<Page<TransactionSummary>> {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.page !== undefined) query.set('page', String(params.page));
    if (params.size !== undefined) query.set('size', String(params.size));
    query.set('sort', 'createdAt,desc');
    return this.http.get<Page<TransactionSummary>>(
      this.url(`/api/escrow?${query}`),
      this.defaultOptions,
    );
  }

  getTransaction(id: string): Observable<TransactionDetail> {
    return this.http.get<TransactionDetail>(this.url(`/api/escrow/${id}`), this.defaultOptions);
  }

  generateVerificationCode(id: string, expirationMinutes = 15): Observable<{ verificationCode: string }> {
    return this.http.post<{ verificationCode: string }>(
      this.url(`/api/escrow/${id}/verification-code`),
      { expirationMinutes },
      this.defaultOptions,
    );
  }

  scanVerificationCode(transactionId: string, code: string): Observable<ScanResponse> {
    return this.http.post<ScanResponse>(
      this.url('/api/escrow/verification-code/scan'),
      { transactionId, code },
      this.defaultOptions,
    );
  }

  ship(id: string): Observable<TransactionDetail> {
    return this.http.post<TransactionDetail>(
      this.url(`/api/escrow/${id}/ship`), {}, this.defaultOptions,
    );
  }

  deliver(id: string): Observable<TransactionDetail> {
    return this.http.post<TransactionDetail>(
      this.url(`/api/escrow/${id}/deliver`), {}, this.defaultOptions,
    );
  }

  cancel(id: string): Observable<TransactionDetail> {
    return this.http.post<TransactionDetail>(
      this.url(`/api/escrow/${id}/cancel`), {}, this.defaultOptions,
    );
  }
}
