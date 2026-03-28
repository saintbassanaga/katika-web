import { inject } from '@angular/core';
import {
  injectMutation,
  injectQuery,
  QueryClient,
} from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const profileKeys = {
  all:          ['profile'] as const,
  verification: () => [...profileKeys.all, 'verification'] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function injectVerificationStatusQuery() {
  const service = inject(AuthService);
  return injectQuery(() => ({
    queryKey: profileKeys.verification(),
    queryFn:  () => firstValueFrom(service.getVerificationStatus()),
    retry:    false,
  }));
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function injectSubmitVerificationMutation() {
  const service     = inject(AuthService);
  const queryClient = inject(QueryClient);
  return injectMutation(() => ({
    mutationFn: ({ bill1, bill2, notes }: { bill1: File; bill2: File; notes?: string }) =>
      firstValueFrom(service.requestVerification(bill1, bill2, notes)),
    onSuccess: (data) => {
      queryClient.setQueryData(profileKeys.verification(), data);
    },
  }));
}
