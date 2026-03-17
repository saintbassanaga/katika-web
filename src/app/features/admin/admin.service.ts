import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/http/api.service';
import { Page, TransactionSummary } from '@app/models';
import { DisputeResponse, ResolutionType } from '@features/disputes/dispute.service';
import { UserAdminResponse, CreateStaffRequest } from '@shared/models/model';

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalBuyers: number;
  totalSellers: number;
  totalStaff: number;
  totalTransactions: number;
  initiatedTransactions: number;
  lockedTransactions: number;
  releasedTransactions: number;
  disputedTransactions: number;
  cancelledTransactions: number;
  totalVolumeReleased: string;
  totalDisputes: number;
  openDisputes: number;
  underReviewDisputes: number;
  referredToArbitrationDisputes: number;
  resolvedDisputes: number;
}
@Injectable({ providedIn: 'root' })
export class AdminService extends ApiService {

  // ── Dashboard ─────────────────────────────────────────────────

  getDashboard(): Observable<AdminDashboardStats> {
    return this.http.get<AdminDashboardStats>(this.url('/api/admin/dashboard'), this.defaultOptions);
  }

  // ── Disputes (admin / support) ────────────────────────────────

  /** Admin: all disputes. Support: their assigned queue (unassigned=false) or pool (unassigned=true). */
  getDisputes(params: {
    isAdmin: boolean;
    unassigned?: boolean;
    status?: string;
    page?: number;
    size?: number;
  }): Observable<Page<DisputeResponse>> {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    query.set('page', String(params.page ?? 0));
    query.set('size', String(params.size ?? 20));

    const path = params.isAdmin
      ? `/api/admin/disputes?${query}`
      : `/api/support/disputes?unassigned=${params.unassigned ?? false}&${query}`;

    return this.http.get<Page<DisputeResponse>>(this.url(path), this.defaultOptions);
  }

  getDispute(id: string, isAdmin: boolean): Observable<DisputeResponse> {
    const path = isAdmin
      ? `/api/admin/disputes/${id}`
      : `/api/support/disputes/${id}`;
    return this.http.get<DisputeResponse>(this.url(path), this.defaultOptions);
  }

  assignDispute(disputeId: string, agentId: string): Observable<DisputeResponse> {
    return this.http.post<DisputeResponse>(
      this.url(`/api/admin/disputes/${disputeId}/assign`),
      { agentId },
      this.defaultOptions,
    );
  }

  unassignDispute(disputeId: string): Observable<DisputeResponse> {
    return this.http.post<DisputeResponse>(
      this.url(`/api/admin/disputes/${disputeId}/unassign`),
      {},
      this.defaultOptions,
    );
  }

  updateDisputeStatus(disputeId: string, status: 'AWAITING_BUYER' | 'AWAITING_SELLER', note?: string): Observable<DisputeResponse> {
    return this.http.patch<DisputeResponse>(
      this.url(`/api/support/disputes/${disputeId}/status`),
      { status, ...(note ? { note } : {}) },
      this.defaultOptions,
    );
  }

  updateNotes(disputeId: string, notes: string): Observable<DisputeResponse> {
    return this.http.patch<DisputeResponse>(
      this.url(`/api/support/disputes/${disputeId}/notes`),
      { notes },
      this.defaultOptions,
    );
  }

  resolveDispute(
    disputeId: string,
    resolutionType: ResolutionType,
    actorType?: string,
    actorId?: string,
    sellerPercent?: number,
  ): Observable<DisputeResponse> {
    return this.http.post<DisputeResponse>(
      this.url(`/api/disputes/${disputeId}/resolve`),
      {
        resolutionType,
        actorType: actorType ?? null,
        actorId: actorId ?? null,
        sellerPercent: sellerPercent ?? null,
      },
      this.defaultOptions,
    );
  }

  // ── User management (admin only) ──────────────────────────────

  getUsers(params?: { role?: string; active?: boolean; page?: number; size?: number }): Observable<Page<UserAdminResponse>> {
    const query = new URLSearchParams();
    if (params?.role) query.set('role', params.role);
    if (params?.active !== undefined) query.set('active', String(params.active));
    query.set('page', String(params?.page ?? 0));
    query.set('size', String(params?.size ?? 20));
    return this.http.get<Page<UserAdminResponse>>(this.url(`/api/admin/users?${query}`), this.defaultOptions);
  }

  createStaff(payload: CreateStaffRequest): Observable<UserAdminResponse> {
    return this.http.post<UserAdminResponse>(this.url('/api/admin/users/staff'), payload, this.defaultOptions);
  }

  activateUser(userId: string): Observable<UserAdminResponse> {
    return this.http.patch<UserAdminResponse>(this.url(`/api/admin/users/${userId}/activate`), {}, this.defaultOptions);
  }

  deactivateUser(userId: string): Observable<UserAdminResponse> {
    return this.http.patch<UserAdminResponse>(this.url(`/api/admin/users/${userId}/deactivate`), {}, this.defaultOptions);
  }

  // ── Transaction oversight (admin only) ────────────────────────

  getAdminTransactions(params?: { status?: string; page?: number; size?: number }): Observable<Page<TransactionSummary>> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    query.set('page', String(params?.page ?? 0));
    query.set('size', String(params?.size ?? 20));
    return this.http.get<Page<TransactionSummary>>(this.url(`/api/admin/transactions?${query}`), this.defaultOptions);
  }
}
