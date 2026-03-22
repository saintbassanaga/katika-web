import { inject } from '@angular/core';
import {
  injectMutation,
  injectQuery,
  injectQueryClient,
} from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { EscrowService } from './escrow.service';
import type { EscrowCreateRequest } from './escrow.service';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const escrowKeys = {
  all: ['escrow'] as const,
  lists: () => [...escrowKeys.all, 'list'] as const,
  list: (params: { status?: string; page?: number; size?: number }) =>
    [...escrowKeys.lists(), params] as const,
  detail: (id: string) => [...escrowKeys.all, 'detail', id] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function injectEscrowListQuery(params: {
  status?: string;
  page?: number;
  size?: number;
} = {}) {
  const service = inject(EscrowService);
  return injectQuery(() => ({
    queryKey: escrowKeys.list(params),
    queryFn: () => firstValueFrom(service.getTransactions(params)),
  }));
}

export function injectEscrowDetailQuery(id: () => string) {
  const service = inject(EscrowService);
  return injectQuery(() => ({
    queryKey: escrowKeys.detail(id()),
    queryFn: () => firstValueFrom(service.getTransaction(id())),
    enabled: !!id(),
  }));
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function injectCreateEscrowMutation() {
  const service = inject(EscrowService);
  const queryClient = injectQueryClient();
  return injectMutation(() => ({
    mutationFn: (req: EscrowCreateRequest) => firstValueFrom(service.createTransaction(req)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: escrowKeys.lists() }),
  }));
}

export function injectReleaseEscrowMutation() {
  const service = inject(EscrowService);
  const queryClient = injectQueryClient();
  return injectMutation(() => ({
    mutationFn: ({ id, verificationCode }: { id: string; verificationCode: string }) =>
      firstValueFrom(service.release(id, verificationCode)),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: escrowKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: escrowKeys.lists() });
    },
  }));
}
