import { inject } from '@angular/core';
import {
  injectMutation,
  injectQuery,
  QueryClient,
} from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { AdminService } from './admin.service';
import type { AdminDashboardStats } from './admin.service';
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
