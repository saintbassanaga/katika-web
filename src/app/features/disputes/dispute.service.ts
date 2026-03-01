import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/http/api.service';
import { Page } from '@features/escrow/escrow.service';

export interface DisputeSummary {
  id: string;
  transactionRef: string;
  reason: string;
  status: string;
  createdAt: string;
}

export interface DisputeDetail {
  id: string;
  transactionRef: string;
  transactionId: string;
  reason: DisputeReason;
  status: string;
  description?: string;
  createdAt: string;
  buyerName: string;
  sellerName: string;
  grossAmount: number;
  currency: string;
  messages: DisputeMessage[];
}

export interface DisputeMessage {
  id: string;
  disputeId: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  messageType: string;
  internalOnly: boolean;
  attachmentCount: number;
  attachmentIds: string;
  createdAt: string;
}

export type DisputeReason =
  // Livraison
  | 'NOT_RECEIVED' | 'LATE_DELIVERY' | 'WRONG_ADDRESS' | 'PARTIAL_DELIVERY'
  // Qualité
  | 'NOT_AS_DESCRIBED' | 'DEFECTIVE' | 'COUNTERFEIT' | 'WRONG_ITEM' | 'QUALITY_ISSUE'
  // Service
  | 'SERVICE_NOT_RENDERED' | 'SERVICE_INCOMPLETE' | 'SERVICE_UNSATISFACTORY'
  // Communication
  | 'SELLER_UNRESPONSIVE' | 'BUYER_UNRESPONSIVE'
  // Financier
  | 'OVERCHARGED' | 'HIDDEN_FEES'
  // Fraude
  | 'SUSPECTED_FRAUD' | 'UNAUTHORIZED_TRANSACTION'
  // Autre
  | 'OTHER';

export interface CreateDisputeRequest {
  transactionId: string;
  initiatorId: string;
  initiatorRole: 'BUYER' | 'SELLER' | 'ADMIN' | 'SUPPORT' | 'SUPERVISOR';
  reason: DisputeReason;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class DisputeService extends ApiService {
  getDisputes(params?: { status?: string; page?: number; size?: number }): Observable<Page<DisputeSummary>> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    query.set('page', String(params?.page ?? 0));
    query.set('size', String(params?.size ?? 20));
    return this.http.get<Page<DisputeSummary>>(this.url(`/api/disputes?${query}`), this.defaultOptions);
  }

  getDispute(id: string): Observable<DisputeDetail> {
    return this.http.get<DisputeDetail>(this.url(`/api/disputes/${id}`), this.defaultOptions);
  }

  createDispute(req: CreateDisputeRequest): Observable<any> {
    return this.http.post(this.url('/api/disputes'), req, this.defaultOptions);
  }

  getMessages(disputeId: string): Observable<DisputeMessage[]> {
    return this.http.get<DisputeMessage[]>(this.url(`/api/disputes/${disputeId}/messages`), this.defaultOptions);
  }

  sendMessage(disputeId: string, content: string): Observable<DisputeMessage> {
    return this.http.post<DisputeMessage>(this.url(`/api/disputes/${disputeId}/messages`), { content }, this.defaultOptions);
  }

  uploadEvidence(disputeId: string, files: File[]): Observable<any> {
    const form = new FormData();
    files.forEach(f => form.append('files', f, f.name));
    return this.http.post(this.url(`/api/disputes/${disputeId}/evidence`), form, this.defaultOptions);
  }
}
