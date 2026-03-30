import { inject } from '@angular/core';
import {
  injectMutation,
  injectQuery,
  QueryClient,
} from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { AdminService } from './admin.service';
import type { ResolutionType } from '@features/disputes/dispute.service';
import type { CreateStaffRequest } from '@shared/models/model';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const adminKeys = {
  all: ['admin'] as const,
  dashboard: () => [...adminKeys.all, 'dashboard'] as const,
  disputes: (params: object) => [...adminKeys.all, 'disputes', params] as const,
  dispute: (id: string) => [...adminKeys.all, 'dispute', id] as const,
  users: (params: object) => [...adminKeys.all, 'users', params] as const,
  transactions: (params: object) => [...adminKeys.all, 'transactions', params] as const,
  // stats — trends
  volumeTrend: (months: number) => [...adminKeys.all, 'stats', 'volume', months] as const,
  disputeTrend: (months: number) => [...adminKeys.all, 'stats', 'disputes', months] as const,
  transactionTrend: (months: number) => [...adminKeys.all, 'stats', 'transactions', months] as const,
  revenueTrend: (months: number) => [...adminKeys.all, 'stats', 'revenue', months] as const,
  newUsersTrend: (months: number) => [...adminKeys.all, 'stats', 'new-users', months] as const,
  activeUsersTrend: (months: number) => [...adminKeys.all, 'stats', 'active-users', months] as const,
  payoutTrend: (months: number) => [...adminKeys.all, 'stats', 'payouts', months] as const,
  disputeRateTrend: (months: number) => [...adminKeys.all, 'stats', 'dispute-rate', months] as const,
  // stats — snapshots
  transactionSummary: () => [...adminKeys.all, 'stats', 'transaction-summary'] as const,
  escrowLifecycle: () => [...adminKeys.all, 'stats', 'escrow-lifecycle'] as const,
  disputeReasons: () => [...adminKeys.all, 'stats', 'dispute-reasons'] as const,
  disputeOutcomes: () => [...adminKeys.all, 'stats', 'dispute-outcomes'] as const,
  disputeSummary: () => [...adminKeys.all, 'stats', 'dispute-summary'] as const,
  userRoles: () => [...adminKeys.all, 'stats', 'user-roles'] as const,
  payoutOperators: () => [...adminKeys.all, 'stats', 'payout-operators'] as const,
  payoutSummary: () => [...adminKeys.all, 'stats', 'payout-summary'] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function injectAdminDashboardQuery(enabled: () => boolean = () => true) {
  const service = inject(AdminService);
  return injectQuery(() => ({
    queryKey: adminKeys.dashboard(),
    queryFn: () => firstValueFrom(service.getDashboard()),
    enabled: enabled(),
  }));
}

export function injectAdminDisputesQuery(params: () => {
  isAdmin: boolean;
  unassigned?: boolean;
  status?: string;
  page?: number;
  size?: number;
}) {
  const service = inject(AdminService);
  return injectQuery(() => ({
    queryKey: adminKeys.disputes(params()),
    queryFn: () => firstValueFrom(service.getDisputes(params())),
  }));
}

export function injectAdminDisputeDetailQuery(id: () => string, isAdmin: () => boolean) {
  const service = inject(AdminService);
  return injectQuery(() => ({
    queryKey: adminKeys.dispute(id()),
    queryFn: () => firstValueFrom(service.getDispute(id(), isAdmin())),
    enabled: !!id(),
  }));
}

export function injectAdminUsersQuery(params: () => {
  role?: string;
  active?: boolean;
  page?: number;
  size?: number;
}) {
  const service = inject(AdminService);
  return injectQuery(() => ({
    queryKey: adminKeys.users(params()),
    queryFn: () => firstValueFrom(service.getUsers(params())),
  }));
}

export function injectAdminTransactionsQuery(params: () => {
  status?: string;
  page?: number;
  size?: number;
}) {
  const service = inject(AdminService);
  return injectQuery(() => ({
    queryKey: adminKeys.transactions(params()),
    queryFn: () => firstValueFrom(service.getAdminTransactions(params())),
  }));
}

// ─── Stats queries — trends ───────────────────────────────────────────────────

export function injectVolumeTrendQuery(months: () => number = () => 12) {
  const service = inject(AdminService);
  return injectQuery(() => ({
    queryKey: adminKeys.volumeTrend(months()),
    queryFn: () => firstValueFrom(service.getVolumeTrend(months())),
  }));
}

export function injectDisputeTrendQuery(months: () => number = () => 12) {
  const service = inject(AdminService);
  return injectQuery(() => ({
    queryKey: adminKeys.disputeTrend(months()),
    queryFn: () => firstValueFrom(service.getDisputeTrend(months())),
  }));
}

export function injectTransactionTrendQuery(months: () => number = () => 12) {
  const service = inject(AdminService);
  return injectQuery(() => ({
    queryKey: adminKeys.transactionTrend(months()),
    queryFn: () => firstValueFrom(service.getTransactionTrend(months())),
  }));
}

export function injectRevenueTrendQuery(months: () => number = () => 12) {
  const service = inject(AdminService);
  return injectQuery(() => ({
    queryKey: adminKeys.revenueTrend(months()),
    queryFn: () => firstValueFrom(service.getRevenueTrend(months())),
  }));
}

export function injectNewUsersTrendQuery(months: () => number = () => 12) {
  const service = inject(AdminService);
  return injectQuery(() => ({
    queryKey: adminKeys.newUsersTrend(months()),
    queryFn: () => firstValueFrom(service.getNewUsersTrend(months())),
  }));
}

export function injectActiveUsersTrendQuery(months: () => number = () => 12) {
  const service = inject(AdminService);
  return injectQuery(() => ({
    queryKey: adminKeys.activeUsersTrend(months()),
    queryFn: () => firstValueFrom(service.getActiveUsersTrend(months())),
  }));
}

export function injectPayoutTrendQuery(months: () => number = () => 12) {
  const service = inject(AdminService);
  return injectQuery(() => ({
    queryKey: adminKeys.payoutTrend(months()),
    queryFn: () => firstValueFrom(service.getPayoutTrend(months())),
  }));
}

export function injectDisputeRateTrendQuery(months: () => number = () => 12) {
  const service = inject(AdminService);
  return injectQuery(() => ({
    queryKey: adminKeys.disputeRateTrend(months()),
    queryFn: () => firstValueFrom(service.getDisputeRateTrend(months())),
  }));
}

// ─── Stats queries — snapshots ────────────────────────────────────────────────

export function injectTransactionSummaryQuery() {
  const service = inject(AdminService);
  return injectQuery(() => ({
    queryKey: adminKeys.transactionSummary(),
    queryFn: () => firstValueFrom(service.getTransactionStatusSummary()),
  }));
}

export function injectEscrowLifecycleQuery() {
  const service = inject(AdminService);
  return injectQuery(() => ({
    queryKey: adminKeys.escrowLifecycle(),
    queryFn: () => firstValueFrom(service.getEscrowLifecycle()),
  }));
}

export function injectDisputeReasonsQuery() {
  const service = inject(AdminService);
  return injectQuery(() => ({
    queryKey: adminKeys.disputeReasons(),
    queryFn: () => firstValueFrom(service.getDisputeReasonBreakdown()),
  }));
}

export function injectDisputeOutcomesQuery() {
  const service = inject(AdminService);
  return injectQuery(() => ({
    queryKey: adminKeys.disputeOutcomes(),
    queryFn: () => firstValueFrom(service.getDisputeOutcomeBreakdown()),
  }));
}

export function injectDisputeSummaryQuery() {
  const service = inject(AdminService);
  return injectQuery(() => ({
    queryKey: adminKeys.disputeSummary(),
    queryFn: () => firstValueFrom(service.getDisputeStatusSummary()),
  }));
}

export function injectUserRolesQuery() {
  const service = inject(AdminService);
  return injectQuery(() => ({
    queryKey: adminKeys.userRoles(),
    queryFn: () => firstValueFrom(service.getUserRoleSummary()),
  }));
}

export function injectPayoutOperatorsQuery() {
  const service = inject(AdminService);
  return injectQuery(() => ({
    queryKey: adminKeys.payoutOperators(),
    queryFn: () => firstValueFrom(service.getPayoutOperatorStats()),
  }));
}

export function injectPayoutSummaryQuery() {
  const service = inject(AdminService);
  return injectQuery(() => ({
    queryKey: adminKeys.payoutSummary(),
    queryFn: () => firstValueFrom(service.getPayoutStatusSummary()),
  }));
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function injectAssignDisputeMutation() {
  const service = inject(AdminService);
  const queryClient = inject(QueryClient);
  return injectMutation(() => ({
    mutationFn: ({ disputeId, agentId }: { disputeId: string; agentId: string }) =>
      firstValueFrom(service.assignDispute(disputeId, agentId)),
    onSuccess: (_, { disputeId }) =>
      queryClient.invalidateQueries({ queryKey: adminKeys.dispute(disputeId) }),
  }));
}

export function injectUnassignDisputeMutation() {
  const service = inject(AdminService);
  const queryClient = inject(QueryClient);
  return injectMutation(() => ({
    mutationFn: (disputeId: string) => firstValueFrom(service.unassignDispute(disputeId)),
    onSuccess: (_, disputeId) =>
      queryClient.invalidateQueries({ queryKey: adminKeys.dispute(disputeId) }),
  }));
}

export function injectResolveAdminDisputeMutation() {
  const service = inject(AdminService);
  const queryClient = inject(QueryClient);
  return injectMutation(() => ({
    mutationFn: (payload: {
      disputeId: string;
      resolutionType: ResolutionType;
      actorType?: string;
      actorId?: string;
      sellerPercent?: number;
    }) =>
      firstValueFrom(
        service.resolveDispute(
          payload.disputeId,
          payload.resolutionType,
          payload.actorType,
          payload.actorId,
          payload.sellerPercent,
        ),
      ),
    onSuccess: (_, { disputeId }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.dispute(disputeId) });
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  }));
}

export function injectCreateStaffMutation() {
  const service = inject(AdminService);
  const queryClient = inject(QueryClient);
  return injectMutation(() => ({
    mutationFn: (payload: CreateStaffRequest) => firstValueFrom(service.createStaff(payload)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.users({}) }),
  }));
}

export function injectToggleUserActiveMutation() {
  const service = inject(AdminService);
  const queryClient = inject(QueryClient);
  return injectMutation(() => ({
    mutationFn: ({ userId, activate }: { userId: string; activate: boolean }) =>
      firstValueFrom(activate ? service.activateUser(userId) : service.deactivateUser(userId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  }));
}
