import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/http/api.service';
import {
  CreateDisputeRequest,
  DisputeMessage,
  DisputeReason,
  DisputeResponse,
  DisputeStatus,
  DisputeStatusEvent,
  Page,
  ResolveDisputeRequest,
  ResolutionType,
} from '@shared/models/model';

export type {
  CreateDisputeRequest,
  DisputeMessage,
  DisputeReason,
  DisputeResponse,
  DisputeStatus,
  DisputeStatusEvent,
  ResolveDisputeRequest,
  ResolutionType,
};

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

  uploadEvidence(disputeId: string, file: File, evidenceType: string): Observable<unknown> {
    const formData = new FormData();
    formData.append(
      'request',
      new Blob([JSON.stringify({ evidenceType, description: file.name })], { type: 'application/json' }),
    );
    formData.append('file', file);
    return this.http.post(this.url(`/api/disputes/${disputeId}/evidence`), formData, { withCredentials: true });
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
}
