import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/http/api.service';
import { Page, TransactionSummary } from '@app/models';
import { DisputeResponse, ResolutionType } from '@features/disputes/dispute.service';
import { UserAdminResponse, CreateStaffRequest } from '@shared/models/model';

// ── Stats response types ──────────────────────────────────────────────────────

export interface VolumeTrendResponse {
  labels: string[];
  volume: number[];
  count: number[];
}

export interface DisputeTrendResponse {
  labels: string[];
  opened: number[];
  resolved: number[];
}

export interface MonthlyTransactionTrendResponse {
  labels: string[];
  totalCreated: number[];
  released: number[];
  failed: number[];
  disputed: number[];
  completionRatePct: number[];
}

export interface MonthlyRevenueResponse {
  labels: string[];
  feesCollected: number[];
  avgFeePct: number[];
  transactionsCompleted: number[];
  grossVolume: number[];
}

export interface MonthlyNewUsersResponse {
  labels: string[];
  totalRegistered: number[];
  buyers: number[];
  sellers: number[];
  staff: number[];
  verified: number[];
}

export interface MonthlyActiveUsersResponse {
  labels: string[];
  activeUsers: number[];
  activeBuyers: number[];
  activeSellers: number[];
}

export interface MonthlyPayoutResponse {
  labels: string[];
  mtnCount: number[];
  mtnAmount: number[];
  orangeCount: number[];
  orangeAmount: number[];
  totalCount: number[];
  totalAmount: number[];
}

export interface MonthlyDisputeRateResponse {
  labels: string[];
  disputesOpened: number[];
  transactionsCreated: number[];
  disputeRatePct: number[];
}

export interface TransactionStatusEntry {
  status: string;
  txCount: number;
  totalGross: number;
  totalFees: number;
  avgAmount: number;
}

export interface EscrowLifecycleResponse {
  avgMinInitiatedToLocked: number | null;
  avgMinLockedToShipped: number | null;
  avgMinLockedToReleased: number | null;
  avgMinTotalLifecycle: number | null;
  avgMinLockedToDisputed: number | null;
  sampleReleased: number;
  sampleDisputed: number;
}

export interface DisputeReasonEntry {
  reason: string;
  total: number;
  resolved: number;
  wentToArbitration: number;
  closedNoAction: number;
  resolutionRatePct: number;
}

export interface DisputeOutcomeEntry {
  status: string;
  resolutionType: string;
  total: number;
  avgHoursToResolve: number | null;
  avgRefundedToBuyer: number | null;
  avgReleasedToSeller: number | null;
}

export interface DisputeStatusEntry {
  status: string;
  disputeCount: number;
  avgPriority: number;
  assignedCount: number;
  unassignedCount: number;
  escalatedCount: number;
}

export interface UserRoleEntry {
  role: string;
  total: number;
  activeCount: number;
  inactiveCount: number;
  verifiedCount: number;
  deletedCount: number;
}

export interface PayoutOperatorEntry {
  operator: string;
  total: number;
  completed: number;
  failed: number;
  successRatePct: number;
  volumeCompleted: number;
  feesCompleted: number;
  avgCompletedAmount: number;
}

export interface PayoutStatusEntry {
  status: string;
  payoutCount: number;
  totalAmount: number;
  avgAmount: number;
}

// ─────────────────────────────────────────────────────────────────────────────

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
        actorId,
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

  // ── Stats — trend endpoints ───────────────────────────────────

  getVolumeTrend(months = 12): Observable<VolumeTrendResponse> {
    return this.http.get<VolumeTrendResponse>(this.url(`/api/admin/stats/volume?months=${months}`), this.defaultOptions);
  }

  getDisputeTrend(months = 12): Observable<DisputeTrendResponse> {
    return this.http.get<DisputeTrendResponse>(this.url(`/api/admin/stats/disputes?months=${months}`), this.defaultOptions);
  }

  getTransactionTrend(months = 12): Observable<MonthlyTransactionTrendResponse> {
    return this.http.get<MonthlyTransactionTrendResponse>(this.url(`/api/admin/stats/transactions?months=${months}`), this.defaultOptions);
  }

  getRevenueTrend(months = 12): Observable<MonthlyRevenueResponse> {
    return this.http.get<MonthlyRevenueResponse>(this.url(`/api/admin/stats/revenue?months=${months}`), this.defaultOptions);
  }

  getNewUsersTrend(months = 12): Observable<MonthlyNewUsersResponse> {
    return this.http.get<MonthlyNewUsersResponse>(this.url(`/api/admin/stats/users/registrations?months=${months}`), this.defaultOptions);
  }

  getActiveUsersTrend(months = 12): Observable<MonthlyActiveUsersResponse> {
    return this.http.get<MonthlyActiveUsersResponse>(this.url(`/api/admin/stats/users/active?months=${months}`), this.defaultOptions);
  }

  getPayoutTrend(months = 12): Observable<MonthlyPayoutResponse> {
    return this.http.get<MonthlyPayoutResponse>(this.url(`/api/admin/stats/payouts?months=${months}`), this.defaultOptions);
  }

  getDisputeRateTrend(months = 12): Observable<MonthlyDisputeRateResponse> {
    return this.http.get<MonthlyDisputeRateResponse>(this.url(`/api/admin/stats/dispute-rate?months=${months}`), this.defaultOptions);
  }

  // ── Stats — snapshot endpoints ────────────────────────────────

  getTransactionStatusSummary(): Observable<TransactionStatusEntry[]> {
    return this.http.get<TransactionStatusEntry[]>(this.url('/api/admin/stats/transaction-summary'), this.defaultOptions);
  }

  getEscrowLifecycle(): Observable<EscrowLifecycleResponse> {
    return this.http.get<EscrowLifecycleResponse>(this.url('/api/admin/stats/escrow-lifecycle'), this.defaultOptions);
  }

  getDisputeReasonBreakdown(): Observable<DisputeReasonEntry[]> {
    return this.http.get<DisputeReasonEntry[]>(this.url('/api/admin/stats/dispute-reasons'), this.defaultOptions);
  }

  getDisputeOutcomeBreakdown(): Observable<DisputeOutcomeEntry[]> {
    return this.http.get<DisputeOutcomeEntry[]>(this.url('/api/admin/stats/dispute-outcomes'), this.defaultOptions);
  }

  getDisputeStatusSummary(): Observable<DisputeStatusEntry[]> {
    return this.http.get<DisputeStatusEntry[]>(this.url('/api/admin/stats/dispute-summary'), this.defaultOptions);
  }

  getUserRoleSummary(): Observable<UserRoleEntry[]> {
    return this.http.get<UserRoleEntry[]>(this.url('/api/admin/stats/user-roles'), this.defaultOptions);
  }

  getPayoutOperatorStats(): Observable<PayoutOperatorEntry[]> {
    return this.http.get<PayoutOperatorEntry[]>(this.url('/api/admin/stats/payout-operators'), this.defaultOptions);
  }

  getPayoutStatusSummary(): Observable<PayoutStatusEntry[]> {
    return this.http.get<PayoutStatusEntry[]>(this.url('/api/admin/stats/payout-summary'), this.defaultOptions);
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
