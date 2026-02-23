import { Component, inject, input, OnInit, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PayoutService } from '../payout.service';
import { OtpInputComponent } from '@shared/components/otp-input/otp-input.component';
import { ToastService } from '@core/notification/toast.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-payout-otp',
  standalone: true,
  imports: [OtpInputComponent, TranslatePipe],
  template: `
    <div class="px-4 py-12 max-w-sm mx-auto text-center">
      <div class="text-5xl mb-4">📱</div>
      <h1 class="text-xl font-bold text-gray-900 mb-2">{{ 'payouts.otp.title' | translate }}</h1>
      <p class="text-sm text-gray-500 mb-8">
        {{ 'payouts.otp.subtitle' | translate }}
      </p>

      <app-otp-input (completed)="onCode($event)" [(value)]="otpValue" />

      @if (error()) {
        <p class="text-sm text-red-600 mt-4">{{ error() }}</p>
      }

      @if (loading()) {
        <div class="mt-6">
          <span class="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
        </div>
      }

      <!-- Resend OTP -->
      <div class="mt-8">
        @if (resendCountdown() > 0) {
          <p class="text-sm text-gray-400">
            {{ 'payouts.otp.resendIn' | translate:{ count: resendCountdown() } }}
          </p>
        } @else {
          <button
            (click)="resendOtp()"
            class="text-sm text-blue-600 hover:underline font-medium"
          >
            {{ 'payouts.otp.resend' | translate }}
          </button>
        }
      </div>
    </div>
  `,
})
export class PayoutOtpComponent implements OnInit, OnDestroy {
  readonly id = input.required<string>();

  private readonly payoutService = inject(PayoutService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly resendCountdown = signal(60);
  protected otpValue = '';
  private countdownInterval?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.startCountdown();
  }

  protected onCode(code: string): void {
    this.error.set('');
    this.loading.set(true);
    this.payoutService.submit(this.id(), code).subscribe({
      next: () => {
        this.toast.success('Retrait en cours de traitement');
        this.router.navigate(['/wallet']);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Code invalide. Réessayez.');
      },
    });
  }

  protected resendOtp(): void {
    this.payoutService.requestOtp(this.id()).subscribe({
      next: () => {
        this.toast.success('Code renvoyé par SMS');
        this.resendCountdown.set(60);
        this.startCountdown();
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
