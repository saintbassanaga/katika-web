import { Component, computed, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { OtpInputComponent } from '@shared/components/otp-input/otp-input.component';
import { ToastService } from '@core/notification/toast.service';
import { TranslatePipe } from '@ngx-translate/core';
import {
  injectValidatePayoutOtpMutation,
  injectSubmitPayoutMutation,
  injectResendPayoutOtpMutation,
} from '../payout.queries';
import type { PayoutStatus } from '@shared/models/model';

@Component({
  selector: 'app-payout-otp',
  standalone: true,
  imports: [OtpInputComponent, TranslatePipe],
  template: `
    <div class="animate-fade px-4 py-12 max-w-sm mx-auto text-center">
      <div class="text-5xl mb-4">{{ isMfa() ? '🔐' : '📱' }}</div>
      <h1 class="text-xl font-bold text-gray-900 mb-2">
        {{ (isMfa() ? 'payouts.otp.mfaTitle' : 'payouts.otp.title') | translate }}
      </h1>
      <p class="text-sm text-gray-500 mb-8">
        {{ (isMfa() ? 'payouts.otp.mfaSubtitle' : 'payouts.otp.subtitle') | translate }}
      </p>

      <app-otp-input (completed)="onCode($event)" [(value)]="otpValue" />

      @if (validateMutation.isError() || submitMutation.isError()) {
        <p class="text-sm text-red-600 mt-4">{{ error() }}</p>
      }

      @if (loading()) {
        <div class="mt-6">
          <span class="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
        </div>
      }

      <!-- Resend OTP — SMS path only; TOTP (MFA) doesn't need a resend -->
      @if (!isMfa()) {
        <div class="mt-8">
          @if (resendCountdown() > 0) {
            <p class="text-sm text-gray-400">
              {{ 'payouts.otp.resendIn' | translate:{ count: resendCountdown() } }}
            </p>
          } @else {
            <button
              (click)="resendOtp()"
              [disabled]="resendMutation.isPending()"
              class="text-sm text-blue-600 hover:underline font-medium disabled:opacity-50"
            >
              {{ resendMutation.isPending()
                  ? ('payouts.otp.resending' | translate)
                  : ('payouts.otp.resend' | translate) }}
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class PayoutOtpComponent implements OnInit, OnDestroy {
  readonly id = input.required<string>();

  private readonly router = inject(Router);
  private readonly toast  = inject(ToastService);

  protected readonly validateMutation = injectValidatePayoutOtpMutation();
  protected readonly submitMutation   = injectSubmitPayoutMutation();
  protected readonly resendMutation   = injectResendPayoutOtpMutation();

  protected readonly loading = computed(
    () => this.validateMutation.isPending() || this.submitMutation.isPending(),
  );

  protected readonly error = computed(() => {
    if (this.validateMutation.isError()) return 'Code invalide. Réessayez.';
    if (this.submitMutation.isError())   return 'Erreur lors de la soumission. Réessayez.';
    return '';
  });

  protected readonly resendCountdown = signal(60);
  protected otpValue = '';
  private countdownInterval?: ReturnType<typeof setInterval>;

  /** True when the payout is waiting for a TOTP from an authenticator app. */
  protected readonly isMfa = signal(false);

  ngOnInit(): void {
    const status = history.state?.['status'] as PayoutStatus | undefined;
    this.isMfa.set(status === 'MFA_PENDING');

    if (!this.isMfa()) {
      this.startCountdown();
    }
  }

  protected onCode(code: string): void {
    this.validateMutation.mutate(
      { payoutId: this.id(), code },
      {
        onSuccess: () => {
          this.submitMutation.mutate(this.id(), {
            onSuccess: () => {
              this.toast.success('Retrait en cours de traitement');
              this.router.navigate(['/wallet']);
            },
          });
        },
      },
    );
  }

  protected resendOtp(): void {
    this.resendMutation.mutate(this.id(), {
      onSuccess: () => {
        this.otpValue = '';
        this.resendCountdown.set(60);
        this.startCountdown();
        this.toast.success('Un nouveau code a été envoyé.');
      },
      onError: () => {
        this.toast.error('Impossible d\'envoyer le code. Réessayez.');
      },
    });
  }

  private startCountdown(): void {
    clearInterval(this.countdownInterval);
    this.countdownInterval = setInterval(() => {
      const val = this.resendCountdown();
      if (val > 0) this.resendCountdown.set(val - 1);
      else clearInterval(this.countdownInterval);
    }, 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.countdownInterval);
  }
}