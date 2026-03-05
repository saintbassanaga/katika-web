import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/http/api.service';
import { Page } from '@app/models';

export type DisputeStatus =
  | 'OPENED' | 'UNDER_REVIEW' | 'AWAITING_BUYER' | 'AWAITING_SELLER'
  | 'AWAITING_ARBITRATION_PAYMENT' | 'REFERRED_TO_ARBITRATION'
  | 'RESOLVED_BUYER' | 'RESOLVED_SELLER' | 'RESOLVED_SPLIT'
  | 'CLOSED_NO_ACTION' | 'CANCELLED';

export type DisputeReason =
  | 'NOT_RECEIVED' | 'LATE_DELIVERY' | 'WRONG_ADDRESS' | 'PARTIAL_DELIVERY'
  | 'NOT_AS_DESCRIBED' | 'DEFECTIVE' | 'COUNTERFEIT' | 'WRONG_ITEM' | 'QUALITY_ISSUE'
  | 'SERVICE_NOT_RENDERED' | 'SERVICE_INCOMPLETE' | 'SERVICE_UNSATISFACTORY'
  | 'SELLER_UNRESPONSIVE' | 'BUYER_UNRESPONSIVE'
  | 'OVERCHARGED' | 'HIDDEN_FEES'
  | 'SUSPECTED_FRAUD' | 'UNAUTHORIZED_TRANSACTION'
  | 'OTHER';

export type ResolutionType =
  | 'FULL_REFUND_BUYER' | 'PARTIAL_REFUND_BUYER' | 'RELEASE_TO_SELLER'
  | 'SPLIT_50_50' | 'NO_ACTION' | 'DEFAULT_WIN_BUYER' | 'DEFAULT_WIN_SELLER';

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
  attachmentIds: string | null;
  createdAt: string;
}

/** Full response DTO — matches the backend DisputeResponse */
export interface DisputeResponse {
  id: string;
  reference: string;
  transactionId: string;
  transactionRef: string;
  initiatorId: string;
  initiatorRole: 'BUYER' | 'SELLER';
  reason: DisputeReason;
  description: string;
  claimedAmount: number;
  status: DisputeStatus;
  resolutionType: ResolutionType | null;
  refundedToBuyer: number | null;
  releasedToSeller: number | null;
  // Arbitration — populated when status == AWAITING_ARBITRATION_PAYMENT
  arbitrationFee: number | null;
  submissionDeadline: string | null;       // ISO-8601
  buyerArbitrationFeePaid: boolean;
  sellerArbitrationFeePaid: boolean;
  // Party info — only in detail endpoint
  buyerName: string | null;
  sellerName: string | null;
  grossAmount: number | null;
  currency: string | null;
  createdAt: string;
  resolvedAt: string | null;
  messages: DisputeMessage[];
}

export interface CreateDisputeRequest {
  transactionId: string;
  reason: DisputeReason;
  description: string;
  claimedAmount?: number;
}

export interface ResolveDisputeRequest {
  resolutionType: ResolutionType;
}

/** WebSocket event payload for dispute topic */
export interface DisputeStatusEvent {
  type: 'DISPUTE_STATUS_CHANGED' | 'REFERRED_TO_ARBITRATION' | 'DISPUTE_RESOLVED' | 'NEW_MESSAGE' | 'NEW_EVIDENCE';
  disputeId: string;
  disputeReference: string;
  message: string;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class DisputeService extends ApiService {

  getDisputes(params?: { status?: string; page?: number; size?: number }): Observable<Page<DisputeResponse>> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    query.set('page', String(params?.page ?? 0));
    query.set('size', String(params?.size ?? 20));
    return this.http.get<Page<DisputeResponse>>(this.url(`/api/disputes?${query}`), this.defaultOptions);
  }

  getDispute(id: string): Observable<DisputeResponse> {
    return this.http.get<DisputeResponse>(this.url(`/api/disputes/${id}`), this.defaultOptions);
  }

  createDispute(req: CreateDisputeRequest): Observable<DisputeResponse> {
    return this.http.post<DisputeResponse>(this.url('/api/disputes'), req, this.defaultOptions);
  }

  /** Submit arbitration fee payment for the authenticated user */
  submitArbitrationFee(disputeId: string): Observable<DisputeResponse> {
    return this.http.post<DisputeResponse>(
      this.url(`/api/disputes/${disputeId}/arbitration/submit`),
      {},
      this.defaultOptions,
    );
  }

  /** Resolve a dispute — SUPPORT or ADMIN only */
  resolveDispute(disputeId: string, resolutionType: ResolutionType): Observable<DisputeResponse> {
    return this.http.post<DisputeResponse>(
      this.url(`/api/disputes/${disputeId}/resolve`),
      { resolutionType },
      this.defaultOptions,
    );
  }

  getMessages(disputeId: string): Observable<DisputeMessage[]> {
    return this.http.get<DisputeMessage[]>(this.url(`/api/disputes/${disputeId}/messages`), this.defaultOptions);
  }

  sendMessage(disputeId: string, content: string): Observable<DisputeMessage> {
    return this.http.post<DisputeMessage>(
      this.url(`/api/disputes/${disputeId}/messages`),
      { content },
      this.defaultOptions,
    );
  }

  uploadEvidence(disputeId: string, files: File[]): Observable<void> {
    const form = new FormData();
    files.forEach(f => form.append('files', f, f.name));
    return this.http.post<void>(this.url(`/api/disputes/${disputeId}/evidence`), form, this.defaultOptions);
  }
}
