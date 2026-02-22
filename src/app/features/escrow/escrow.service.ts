import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/http/api.service';

export interface TransactionSummary {
  id: string;
  reference: string;
  counterpartName: string;
  amount: number;
  status: string;
  createdAt: string;
}

export interface TransactionDetail extends TransactionSummary {
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  description?: string;
  platformFee: number;
  netAmount: number;
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class EscrowService extends ApiService {
  getTransactions(params: { status?: string; page?: number; size?: number }): Observable<Page<TransactionSummary>> {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.page !== undefined) query.set('page', String(params.page));
    if (params.size !== undefined) query.set('size', String(params.size));
    query.set('sort', 'createdAt,desc');
    return this.http.get<Page<TransactionSummary>>(
      this.url(`/escrow?${query}`),
      this.defaultOptions,
    );
  }

  getTransaction(id: string): Observable<TransactionDetail> {
    return this.http.get<TransactionDetail>(this.url(`/escrow/${id}`), this.defaultOptions);
  }

  generateVerificationCode(id: string): Observable<{ code: string; qrUri: string; expiresAt: string }> {
    return this.http.post<{ code: string; qrUri: string; expiresAt: string }>(
      this.url(`/escrow/${id}/verification-code`), {}, this.defaultOptions,
    );
  }

  release(id: string, verificationCode: string): Observable<TransactionDetail> {
    return this.http.post<TransactionDetail>(
      this.url(`/escrow/${id}/release`), { verificationCode }, this.defaultOptions,
    );
  }
}
