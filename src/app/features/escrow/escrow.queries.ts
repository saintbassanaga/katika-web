import { inject } from '@angular/core';
import {
  injectInfiniteQuery,
  injectMutation,
  injectQuery,
  injectQueryClient,
} from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { EscrowService } from './escrow.service';
import type { EscrowCreateRequest } from './escrow.service';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const escrowKeys = {
  all:    ['escrow'] as const,
  lists:  () => [...escrowKeys.all, 'list'] as const,
  list:   (status?: string) => [...escrowKeys.lists(), { status }] as const,
  detail: (id: string)      => [...escrowKeys.all, 'detail', id] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Paginated list with infinite scroll — one cache entry per status filter */
export function injectEscrowListInfiniteQuery(status: () => string) {
  const service = inject(EscrowService);
  return injectInfiniteQuery(() => ({
    queryKey: escrowKeys.list(status()),
    queryFn:  ({ pageParam }) =>
      firstValueFrom(service.getTransactions({ status: status() || undefined, page: pageParam, size: 20 })),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.page + 1,
  }));
}

export function injectEscrowDetailQuery(id: () => string) {
  const service = inject(EscrowService);
  return injectQuery(() => ({
    queryKey: escrowKeys.detail(id()),
    queryFn:  () => firstValueFrom(service.getTransaction(id())),
    enabled:  !!id(),
  }));
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function injectCreateEscrowMutation() {
  const service = inject(EscrowService);
  const queryClient = injectQueryClient();
  return injectMutation(() => ({
    mutationFn: (req: EscrowCreateRequest) => firstValueFrom(service.createTransaction(req)),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: escrowKeys.lists() }),
  }));
}

export function injectAcceptEscrowMutation() {
  const service = inject(EscrowService);
  const queryClient = injectQueryClient();
  return injectMutation(() => ({
    mutationFn: (id: string) => firstValueFrom(service.accept(id)),
    onSuccess:  (tx) => {
      queryClient.setQueryData(escrowKeys.detail(tx.id), tx);
      queryClient.invalidateQueries({ queryKey: escrowKeys.lists() });
    },
  }));
}

export function injectShipEscrowMutation() {
  const service = inject(EscrowService);
  const queryClient = injectQueryClient();
  return injectMutation(() => ({
    mutationFn: (id: string) => firstValueFrom(service.ship(id)),
    onSuccess:  (tx) => {
      queryClient.setQueryData(escrowKeys.detail(tx.id), tx);
      queryClient.invalidateQueries({ queryKey: escrowKeys.lists() });
    },
  }));
}

export function injectDeliverEscrowMutation() {
  const service = inject(EscrowService);
  const queryClient = injectQueryClient();
  return injectMutation(() => ({
    mutationFn: (id: string) => firstValueFrom(service.deliver(id)),
    onSuccess:  (tx) => {
      queryClient.setQueryData(escrowKeys.detail(tx.id), tx);
      queryClient.invalidateQueries({ queryKey: escrowKeys.lists() });
    },
  }));
}

export function injectReleaseEscrowMutation() {
  const service = inject(EscrowService);
  const queryClient = injectQueryClient();
  return injectMutation(() => ({
    mutationFn: ({ id, verificationCode }: { id: string; verificationCode: string }) =>
      firstValueFrom(service.release(id, verificationCode)),
    onSuccess:  (tx) => {
      queryClient.setQueryData(escrowKeys.detail(tx.id), tx);
      queryClient.invalidateQueries({ queryKey: escrowKeys.lists() });
    },
  }));
}

export function injectCancelEscrowMutation() {
  const service = inject(EscrowService);
  const queryClient = injectQueryClient();
  return injectMutation(() => ({
    mutationFn: (id: string) => firstValueFrom(service.cancel(id)),
    onSuccess:  (tx) => {
      queryClient.setQueryData(escrowKeys.detail(tx.id), tx);
      queryClient.invalidateQueries({ queryKey: escrowKeys.lists() });
    },
  }));
}
