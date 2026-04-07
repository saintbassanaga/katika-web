import { inject } from '@angular/core';
import {
  injectMutation,
  injectQuery,
  QueryClient,
} from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { PayoutService } from './payout.service';
import type { PayoutRequest } from './payout.service';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const payoutKeys = {
  all: ['payouts'] as const,
  balance: () => [...payoutKeys.all, 'balance'] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function injectBalanceQuery() {
  const service = inject(PayoutService);
  return injectQuery(() => ({
    queryKey: payoutKeys.balance(),
    queryFn: () => firstValueFrom(service.getBalance()),
  }));
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function injectCreatePayoutMutation() {
  const service = inject(PayoutService);
  const queryClient = inject(QueryClient);
  return injectMutation(() => ({
    mutationFn: (req: PayoutRequest) => firstValueFrom(service.create(req)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: payoutKeys.balance() }),
  }));
}

export function injectValidatePayoutOtpMutation() {
  const service = inject(PayoutService);
  const queryClient = inject(QueryClient);
  return injectMutation(() => ({
    mutationFn: ({ payoutId, code }: { payoutId: string; code: string }) =>
      firstValueFrom(service.validateOtp(payoutId, code)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: payoutKeys.balance() }),
  }));
}

export function injectSubmitPayoutMutation() {
  const service = inject(PayoutService);
  const queryClient = inject(QueryClient);
  return injectMutation(() => ({
    mutationFn: (payoutId: string) => firstValueFrom(service.submit(payoutId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: payoutKeys.balance() }),
  }));
}

export function injectResendPayoutOtpMutation() {
  const service = inject(PayoutService);
  return injectMutation(() => ({
    mutationFn: (payoutId: string) => firstValueFrom(service.resendOtp(payoutId)),
  }));
}
