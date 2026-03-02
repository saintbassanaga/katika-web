import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/http/api.service';
import {
  Page,
  DisputeSummary,
  DisputeDetail,
  DisputeMessage,
  DisputeEvidence,
  DisputeReason,
  EvidenceType,
  ResolutionType,
  CreateDisputeRequest,
} from '@app/models';

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

  createDispute(req: CreateDisputeRequest): Observable<DisputeDetail> {
    return this.http.post<DisputeDetail>(this.url('/api/disputes'), req, this.defaultOptions);
  }

  resolveDispute(disputeId: string, resolutionType: ResolutionType): Observable<DisputeDetail> {
    return this.http.post<DisputeDetail>(
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

  /**
   * Upload evidence for a dispute.
   * Backend expects multipart/form-data with two parts:
   *   - "request" → JSON blob { evidenceType, description }
   *   - "file"    → the actual file
   */
  uploadEvidence(
    disputeId: string,
    file: File,
    evidenceType: EvidenceType,
    description = '',
  ): Observable<DisputeEvidence> {
    const form = new FormData();
    form.append(
      'request',
      new Blob([JSON.stringify({ evidenceType, description })], { type: 'application/json' }),
    );
    form.append('file', file, file.name);
    return this.http.post<DisputeEvidence>(
      this.url(`/api/disputes/${disputeId}/evidence`),
      form,
      this.defaultOptions,
    );
  }
}
