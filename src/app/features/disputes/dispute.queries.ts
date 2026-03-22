import { inject } from '@angular/core';
import {
  injectMutation,
  injectQuery,
  injectQueryClient,
} from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { DisputeService } from './dispute.service';
import type { CreateDisputeRequest, ResolutionType } from './dispute.service';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const disputeKeys = {
  all: ['disputes'] as const,
  lists: () => [...disputeKeys.all, 'list'] as const,
  list: (params: { status?: string; page?: number; size?: number }) =>
    [...disputeKeys.lists(), params] as const,
  detail: (id: string) => [...disputeKeys.all, 'detail', id] as const,
  messages: (id: string) => [...disputeKeys.all, 'messages', id] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function injectDisputeListQuery(params: {
  status?: string;
  page?: number;
  size?: number;
} = {}) {
  const service = inject(DisputeService);
  return injectQuery(() => ({
    queryKey: disputeKeys.list(params),
    queryFn: () => firstValueFrom(service.getDisputes(params)),
  }));
}

export function injectDisputeDetailQuery(id: () => string) {
  const service = inject(DisputeService);
  return injectQuery(() => ({
    queryKey: disputeKeys.detail(id()),
    queryFn: () => firstValueFrom(service.getDispute(id())),
    enabled: !!id(),
  }));
}

export function injectDisputeMessagesQuery(id: () => string) {
  const service = inject(DisputeService);
  return injectQuery(() => ({
    queryKey: disputeKeys.messages(id()),
    queryFn: () => firstValueFrom(service.getMessages(id())),
    enabled: !!id(),
  }));
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function injectCreateDisputeMutation() {
  const service = inject(DisputeService);
  const queryClient = injectQueryClient();
  return injectMutation(() => ({
    mutationFn: (req: CreateDisputeRequest) => firstValueFrom(service.createDispute(req)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: disputeKeys.lists() }),
  }));
}

export function injectSendDisputeMessageMutation() {
  const service = inject(DisputeService);
  const queryClient = injectQueryClient();
  return injectMutation(() => ({
    mutationFn: ({ disputeId, content }: { disputeId: string; content: string }) =>
      firstValueFrom(service.sendMessage(disputeId, content)),
    onSuccess: (_, { disputeId }) =>
      queryClient.invalidateQueries({ queryKey: disputeKeys.messages(disputeId) }),
  }));
}

export function injectSubmitArbitrationFeeMutation() {
  const service = inject(DisputeService);
  const queryClient = injectQueryClient();
  return injectMutation(() => ({
    mutationFn: (disputeId: string) =>
      firstValueFrom(service.submitArbitrationFee(disputeId)),
    onSuccess: (_, disputeId) =>
      queryClient.invalidateQueries({ queryKey: disputeKeys.detail(disputeId) }),
  }));
}

export function injectResolveDisputeMutation() {
  const service = inject(DisputeService);
  const queryClient = injectQueryClient();
  return injectMutation(() => ({
    mutationFn: ({ disputeId, resolutionType }: { disputeId: string; resolutionType: ResolutionType }) =>
      firstValueFrom(service.resolveDispute(disputeId, resolutionType)),
    onSuccess: (_, { disputeId }) => {
      queryClient.invalidateQueries({ queryKey: disputeKeys.detail(disputeId) });
      queryClient.invalidateQueries({ queryKey: disputeKeys.lists() });
    },
  }));
}
